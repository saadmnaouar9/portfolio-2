#!/usr/bin/env node
/* =========================================================================
   Asset importer — downloads the FULL project content into your site.
     node tools/import-assets.mjs [behance-dump.json] [--root <dir>]
   Input : behance-dump.json  (created by tools/behance-console-snippet.js,
           run in YOUR browser on your Behance profile — see HOW-TO-IMPORT.md)
   Output: projects/<category>/<slug>/cover.jpg, image-01.jpg …, project-data.json
           projects-local.js  (loaded by the website; rebuilt from every folder)
   Image order is preserved exactly as in the dump. Nothing is invented:
   a project with no images in the dump stays "not fully imported".
   ========================================================================= */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const args = process.argv.slice(2);
const rootIdx = args.indexOf("--root");
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = rootIdx > -1 ? path.resolve(args[rootIdx + 1]) : HERE;
const dumpFile = args.find((a, i) => !a.startsWith("--") && i !== rootIdx + 1) || path.join(HERE, "behance-dump.json");

const FOLDER = { brand: "brand-identity", social: "social-media", print: "print-design", posters: "posters-flyers", packaging: "packaging-product", food: "food-beverage", football: "football-sports", motion: "motion-ai-video", video: "video-editing", web: "web-ui-ux", other: "other" };
const RULES = [
  [/football|soccer|match ?day|sport/i, "football"], [/social|post|story|stories|carousel|instagram|feed/i, "social"],
  [/logo|brand|identity/i, "brand"], [/food|burger|pizza|restaurant|menu|coffee|cafe|drink|beverage/i, "food"],
  [/poster|flyer/i, "posters"], [/print|brochure|card|catalog|roll-?up|banner/i, "print"],
  [/pack|box|bottle|label|mockup|product/i, "packaging"], [/motion|animation|reel|ai video|3d/i, "motion"],
  [/video|edit/i, "video"], [/web|ui|ux|app|landing|dashboard/i, "web"]
];
const guess = t => (RULES.find(([re]) => re.test(t)) || [, "other"])[1];
const slugify = s => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "project";
const load = async f => { const ctx = { window: {} }; vm.runInNewContext(await readFile(path.join(HERE, f), "utf8"), ctx); return ctx.window; };

const SIZES = ["source", "max_3840", "max_1200_webp", "max_1200", "1400", "808"];
const candidates = u => {
  const m = u.match(/^(https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/)([^/]+)\/(.+)$/);
  return m ? [u, ...SIZES.map(s => `${m[1]}${s}/${m[3]}`)].filter((x, i, a) => a.indexOf(x) === i) : [u];
};
async function fetchImg(u) {
  for (const c of candidates(u)) {
    try {
      const r = await fetch(c, { headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioImporter/1.0)" } });
      if (r.ok && /^image\//.test(r.headers.get("content-type") || "")) return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type"), url: c };
    } catch {}
  }
  return null;
}
const extOf = t => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[t] || "jpg");
function dims(b) { // read original width/height so the page never crops or jumps
  try {
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const t = b[i + 1]; if (t >= 0xc0 && t <= 0xcf && t !== 0xc4 && t !== 0xc8 && t !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + b.readUInt16BE(i + 2); } }
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
      const k = b.toString("ascii", 12, 16);
      if (k === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (k === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (k === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    }
  } catch {} return {};
}
async function pool(items, n, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } })); return out; }

const SITE = (await load("projects.js")).SITE || {};
let feed = []; try { feed = (await load("behance-projects.js")).BEHANCE_PROJECTS || []; } catch {}
let addedList = []; try { addedList = (await load("added-projects.js")).ADDED_PROJECTS || []; } catch {}
const base = [...feed, ...addedList];
const protectedIds = new Set(feed.map(p => String(p.behanceId)));   // the original projects stay exactly as they are
const includeExisting = args.includes("--include-existing");
const missing = {};
const dump = JSON.parse(await readFile(dumpFile, "utf8"));
const baseBy = new Map(base.map(p => [String(p.behanceId), p]));
let done = 0, partial = 0;
const report = { exported: [], partial: [], failed: [], skipped: 0 };

for (const d of dump) {
  const _id = String(d.id || (d.url || "").match(/gallery\/(\d+)/)?.[1] || "");
  if (protectedIds.has(_id) && !includeExisting) { console.log(`↷ ${_id}: original project — left untouched`); report.skipped = (report.skipped || 0) + 1; continue; }
  const id = String((d.id || (d.url || "").match(/gallery\/(\d+)/)?.[1]) || "");
  if (!id || !d.images || !d.images.length) { console.warn(`✗ ${id || d.url}: no images in dump — left as "not fully imported"`); report.failed.push({ id, url: d.url, title: d.title || "", reason: "no images found by the browser export" }); continue; }
  const b = baseBy.get(id) || {};
  const title = d.title || b.title || "Project";
  const ov = (SITE.overrides || {})["be-" + id] || {};
  const cats = ov.categories || b.categories || [guess(title)];
  const slug = `${slugify(ov.title || title)}-${id}`;
  const dir = path.join(ROOT, "projects", FOLDER[cats[0]] || "other", slug);
  await mkdir(dir, { recursive: true });

  const imgs = await pool(d.images, 4, async (u, i) => {
    const r = await fetchImg(u); if (!r) { console.warn(`  ! missing image ${i + 1}: ${u}`); (missing[id] ||= []).push({ n: i + 1, url: u }); return null; }
    const file = `image-${String(i + 1).padStart(2, "0")}.${extOf(r.type)}`;
    await writeFile(path.join(dir, file), r.buf);
    return { file, ...dims(r.buf) };
  });
  const ok = imgs.filter(Boolean);
  const coverSrc = b.coverLg || b.cover; let cover = "";
  if (coverSrc) { const r = await fetchImg(coverSrc); if (r) { cover = `cover.${extOf(r.type)}`; await writeFile(path.join(dir, cover), r.buf); } }
  const data = { id: "be-" + id, behanceId: id, slug, title, categories: cats, description: d.description || "", cover, images: ok, videos: d.videos || [], expected: d.images.length, imported: ok.length };
  await writeFile(path.join(dir, "project-data.json"), JSON.stringify(data, null, 2));
  console.log(`${ok.length === d.images.length ? "✓" : "!"} ${slug}: ${ok.length}/${d.images.length} images`);
  if (ok.length === d.images.length) { done++; report.exported.push({ id, title, images: ok.length }); }
  else { partial++; report.partial.push({ id, title, got: ok.length, expected: d.images.length, missing: missing[id] }); }
}

// rebuild projects-local.js from every project-data.json on disk
const found = [];
async function walk(dir) { for (const n of await readdir(dir).catch(() => [])) { const p = path.join(dir, n); if ((await stat(p)).isDirectory()) await walk(p); else if (n === "project-data.json") found.push(p); } }
await walk(path.join(ROOT, "projects"));
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");
const local = await Promise.all(found.map(async f => {
  const d = JSON.parse(await readFile(f, "utf8")), dir = rel(path.dirname(f));
  return { id: d.id, behanceId: d.behanceId, slug: d.slug, title: d.title, categories: d.categories, description: d.description,
    cover: d.cover ? `${dir}/${d.cover}` : "", images: d.images.map(i => ({ src: `${dir}/${i.file}`, w: i.w, h: i.h })), videos: d.videos || [], complete: d.imported === d.expected };
}));
await writeFile(path.join(ROOT, "projects-local.js"), `/* AUTO-GENERATED by tools/import-assets.mjs — do not edit by hand. */\nwindow.LOCAL_PROJECTS = ${JSON.stringify(local, null, 2)};\n`);
const profile = base.length;
const catCount = {}; let imgTotal = 0;
for (const l of local) { for (const c of (l.categories || ["other"])) catCount[c] = (catCount[c] || 0) + 1; imgTotal += l.images.length; }
const noCat = local.filter(l => !(l.categories || []).length).length;
report.totals = { projectsFoundOnProfile: dump.length, projectsWithImages: local.length, imagesImported: imgTotal, categories: catCount };
console.log(`\n==== IMPORT REPORT ====`);
console.log(`Projects in dump:        ${dump.length}  (original projects left untouched: ${report.skipped})`);
console.log(`Exported completely:     ${report.exported.length}`);
console.log(`Exported with missing images: ${report.partial.length}${report.partial.length ? "  → " + report.partial.map(p => `${p.title} (${p.got}/${p.expected})`).join(", ") : ""}`);
console.log(`Failed (no images):      ${report.failed.length}${report.failed.length ? "  → " + report.failed.map(p => p.title || p.id).join(", ") : ""}`);
console.log(`On the website now:      ${local.length} projects with full native presentation`);
console.log(`Images imported:         ${imgTotal}`);
console.log(`Projects per category:   ${Object.entries(catCount).map(([k, v]) => `${k}=${v}`).join("  ")}${noCat ? "  (!! " + noCat + " without category)" : ""}`);
const newInDump = dump.length - report.skipped, newDone = report.exported.length + report.partial.length;
console.log(`TOTAL PORTFOLIO: ${base.length} projects (${protectedIds.size} original + ${base.length - protectedIds.size} added)`);
console.log(newDone === newInDump && report.failed.length === 0 && report.partial.length === 0
  ? `COVERAGE: all ${newInDump} new projects in the dump imported completely; ${report.skipped} original project(s) left untouched.`
  : `COVERAGE INCOMPLETE: ${newInDump} new projects in the dump, ${report.exported.length} complete, ${report.partial.length} with missing images, ${report.failed.length} failed — see lists above.`);
await writeFile(path.join(ROOT, "import-report.json"), JSON.stringify({ when: new Date().toISOString(), ...report }, null, 2));
console.log(`Details saved to import-report.json`);

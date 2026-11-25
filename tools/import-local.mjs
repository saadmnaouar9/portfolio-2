#!/usr/bin/env node
/* =========================================================================
   Import downloaded images from local folders into EXISTING projects.
     node tools/import-local.mjs            import every folder that contains images
     node tools/import-local.mjs --status   only show which folders are ready (changes nothing)
   Put the images of each project in  import-images/<project-id>-<name>/
   Order = file name order (01.jpg, 02.jpg … or Behance's own numbering). First image = cover.
   • Matches folders to existing projects by the number at the start of the folder name.
   • Only projects added by URL are allowed; your 12 originals are never touched.
   • Never creates a project, never edits projects.js / behance-projects.js / added-projects.js.
   Output: projects/<category>/<project>/image-01.jpg … + project-data.json, then projects-local.js
   ========================================================================= */
import { readFile, writeFile, mkdir, readdir, stat, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const args = process.argv.slice(2);
const ri = args.indexOf("--root");
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = ri > -1 ? path.resolve(args[ri + 1]) : HERE;
const STATUS = args.includes("--status");
const FOLDER = { brand: "brand-identity", social: "social-media", print: "print-design", posters: "posters-flyers", packaging: "packaging-product", food: "food-beverage", football: "football-sports", motion: "motion-ai-video", video: "video-editing", web: "web-ui-ux", other: "other" };
const IMG = /\.(jpe?g|png|webp|gif)$/i, VID = /\.(mp4|webm|mov)$/i;
const slugify = s => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "project";
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const load = async (f, k) => { try { const c = { window: {} }; vm.runInNewContext(await readFile(path.join(ROOT, f), "utf8"), c); return c.window[k] || (k === "SITE" ? c.window.SITE : []) || []; } catch { return []; } };
const exists = async p => { try { await stat(p); return true; } catch { return false; } };

function dims(b) {
  try {
    if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const t = b[i + 1]; if (t >= 0xc0 && t <= 0xcf && t !== 0xc4 && t !== 0xc8 && t !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + b.readUInt16BE(i + 2); } }
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
      const k = b.toString("ascii", 12, 16);
      if (k === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (k === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (k === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    }
    if (b.toString("ascii", 0, 3) === "GIF") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  } catch {} return {};
}

const feed = await load("behance-projects.js", "BEHANCE_PROJECTS");
const added = await load("added-projects.js", "ADDED_PROJECTS");
const site = await load("projects.js", "SITE"); const ov = (site && site.overrides) || {};
const originals = new Set(feed.map(p => String(p.behanceId)));
const addedBy = new Map(added.map(p => [String(p.behanceId), p]));

const base = path.join(ROOT, "import-images");
const dirs = (await readdir(base).catch(() => [])).filter(d => !d.startsWith(".")).sort(natural);
const report = { when: new Date().toISOString(), imported: [], waiting: [], skipped: [], warnings: [] };

for (const d of dirs) {
  const full = path.join(base, d); if (!(await stat(full)).isDirectory()) continue;
  const id = (d.match(/^(\d{6,})/) || [])[1];
  if (!id) { report.skipped.push({ folder: d, reason: "folder name must start with the project id" }); continue; }
  if (originals.has(id)) { report.skipped.push({ folder: d, reason: "original project — never modified" }); continue; }
  const proj = addedBy.get(id);
  if (!proj) { report.skipped.push({ folder: d, reason: "no existing project with this id (this tool never creates projects)" }); continue; }

  const files = (await readdir(full)).filter(f => !f.startsWith(".")).sort(natural);
  const imgs = files.filter(f => IMG.test(f)), vids = files.filter(f => VID.test(f));
  const others = files.filter(f => !IMG.test(f) && !VID.test(f));
  if (others.length) report.warnings.push({ folder: d, note: `ignored non-image files: ${others.join(", ")}` });
  if (!imgs.length && !vids.length) { report.waiting.push({ id, title: proj.title, folder: d }); continue; }
  if (STATUS) { report.imported.push({ id, title: proj.title, images: imgs.length, videos: vids.length, folder: d, dryRun: true }); continue; }

  const o = ov["be-" + id] || {}, cats = o.categories || proj.categories || [proj.category || "other"];
  const slug = `${slugify(o.title || proj.title)}-${id}`;
  const out = path.join(ROOT, "projects", FOLDER[cats[0]] || "other", slug);
  await mkdir(out, { recursive: true });

  const outImgs = [];
  for (let i = 0; i < imgs.length; i++) {
    const ext = path.extname(imgs[i]).toLowerCase().replace(".jpeg", ".jpg");
    const name = `image-${String(i + 1).padStart(2, "0")}${ext}`;
    await copyFile(path.join(full, imgs[i]), path.join(out, name));          // original bytes: no recompression
    const b = await readFile(path.join(out, name));
    outImgs.push({ file: name, source: imgs[i], ...dims(b) });
  }
  const outVids = [];
  for (let i = 0; i < vids.length; i++) { const name = `video-${String(i + 1).padStart(2, "0")}${path.extname(vids[i]).toLowerCase()}`; await copyFile(path.join(full, vids[i]), path.join(out, name)); outVids.push(`${path.relative(ROOT, out).split(path.sep).join("/")}/${name}`); }
  const data = { id: "be-" + id, behanceId: id, slug, title: proj.title, categories: cats, description: "", cover: outImgs[0] ? outImgs[0].file : "", images: outImgs, videos: outVids, expected: imgs.length, imported: outImgs.length, source: "local-folder" };
  await writeFile(path.join(out, "project-data.json"), JSON.stringify(data, null, 2));
  report.imported.push({ id, title: proj.title, images: outImgs.length, videos: outVids.length, cover: data.cover, folder: d });
}

if (!STATUS) {
  // rebuild projects-local.js from every project-data.json on disk (accumulates; other projects untouched)
  const found = [];
  const walk = async dir => { for (const n of await readdir(dir).catch(() => [])) { const p = path.join(dir, n); if ((await stat(p)).isDirectory()) await walk(p); else if (n === "project-data.json") found.push(p); } };
  await walk(path.join(ROOT, "projects"));
  const rel = p => path.relative(ROOT, p).split(path.sep).join("/");
  const local = await Promise.all(found.map(async f => {
    const d = JSON.parse(await readFile(f, "utf8")), dir = rel(path.dirname(f));
    return { id: d.id, behanceId: d.behanceId, slug: d.slug, title: d.title, categories: d.categories, description: d.description,
      cover: d.cover ? `${dir}/${d.cover}` : "", images: d.images.map(i => ({ src: `${dir}/${i.file}`, w: i.w, h: i.h })), videos: d.videos || [], complete: d.imported === d.expected };
  }));
  await writeFile(path.join(ROOT, "projects-local.js"), `/* AUTO-GENERATED by tools/import-assets.mjs / tools/import-local.mjs — do not edit by hand. */\nwindow.LOCAL_PROJECTS = ${JSON.stringify(local, null, 2)};\n`);
  await writeFile(path.join(ROOT, "import-local-report.json"), JSON.stringify(report, null, 2));
}

console.log(STATUS ? "==== FOLDER STATUS (nothing changed) ====" : "==== LOCAL IMPORT REPORT ====");
for (const r of report.imported) console.log(`${STATUS ? "READY" : "✓ imported"}  ${r.id}  ${r.title}: ${r.images} image(s)${r.videos ? `, ${r.videos} video(s)` : ""}${r.cover ? `  cover=${r.cover}` : ""}`);
for (const r of report.waiting) console.log(`… waiting  ${r.id}  ${r.title}: folder "${r.folder}" has no images yet`);
for (const r of report.skipped) console.log(`↷ skipped  ${r.folder}: ${r.reason}`);
for (const r of report.warnings) console.log(`! ${r.folder}: ${r.note}`);
console.log(`\nImported: ${report.imported.length}   Waiting for images: ${report.waiting.length}   Skipped: ${report.skipped.length}`);
if (!STATUS) console.log("Hard-refresh the site (Cmd+Shift+R). Run  node tools/check-covers.mjs  to re-audit covers.");

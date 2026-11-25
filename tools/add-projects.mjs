#!/usr/bin/env node
/* =========================================================================
   Add missing Behance projects by URL.   node tools/add-projects.mjs
   -------------------------------------------------------------------------
   1. Paste the Behance URLs of the missing projects into  new-projects.txt
      (one per line; optional category:  URL | social )
   2. Run this script. For every NEW url it:
        • skips duplicates (the 12 existing projects, earlier additions, repeats)
        • reads the title + cover from Behance's official embed page
        • assigns a category from the title (override with "| category")
        • adds the project to the website (added-projects.js) — it appears
          immediately with its cover; your existing projects are NOT touched
        • writes tools/browser-snippet-new.js: a ready-to-paste browser snippet
          that exports the FULL images/videos of ONLY these projects
   3. Run that snippet in Chrome (see HOW-TO-IMPORT.md), then:
        node tools/import-assets.mjs
      (it skips the 12 original projects automatically)
   Options: --root <dir> (read/write somewhere else, for testing)
   ========================================================================= */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const args = process.argv.slice(2);
const ri = args.indexOf("--root");
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = ri > -1 ? path.resolve(args[ri + 1]) : HERE;
const OWNER = "mnaouarsaad";   // only projects owned by this Behance profile are accepted
const UA = "Mozilla/5.0 (compatible; PortfolioImporter/1.0)";

const CATS = ["brand", "social", "print", "posters", "packaging", "food", "football", "motion", "video", "web", "other"];
const RULES = [
  [/football|soccer|match ?day|sport/i, "football"], [/social|post|story|stories|carousel|instagram|feed/i, "social"],
  [/logo|brand|identity/i, "brand"], [/food|burger|pizza|restaurant|menu|coffee|cafe|drink|beverage/i, "food"],
  [/poster|flyer/i, "posters"], [/print|brochure|card|catalog|roll-?up|banner/i, "print"],
  [/pack|box|bottle|label|mockup|product/i, "packaging"], [/motion|animation|reel|ai video|3d/i, "motion"],
  [/video|edit/i, "video"], [/web|ui|ux|app|landing|dashboard/i, "web"]
];
const guess = t => (RULES.find(([re]) => re.test(t)) || [, "other"])[1];
const idOf = u => (String(u).match(/gallery\/(\d+)/) || String(u).match(/project\/(\d+)/) || [])[1];
const readWin = async (dir, f, key) => { try { const ctx = { window: {} }; vm.runInNewContext(await readFile(path.join(dir, f), "utf8"), ctx); return ctx.window[key] || []; } catch { return []; } };
const shapeOf = url => { try { const [, w, h] = Buffer.from(url.split("/").pop().split(".")[1], "base64").toString().split(","); const r = w / h; return r > 1.9 ? "wide" : r > 1.1 ? "landscape" : r < .9 ? "portrait" : "square"; } catch { return "landscape"; } };

async function embed(id) {
  const res = await fetch(`https://www.behance.net/embed/project/${id}?ilo0=1`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Behance returned ${res.status}`);
  const html = await res.text();
  const raw = (html.match(/id="beconfig-store_state">([\s\S]*?)<\/script>/) || [])[1];
  if (!raw) throw new Error("project not found / not public");
  const p = JSON.parse(raw).embedStore.project, c = p.covers || {};
  if (!p.name) throw new Error("project has no public data");
  const owners = (p.owners || []).map(o => String(o.username || "").toLowerCase());
  if (!owners.includes(OWNER.toLowerCase())) throw new Error(`belongs to "${owners.join(", ") || "another account"}", not to ${OWNER} — not imported`);
  return { title: p.name, url: p.url, cover: (c.size_808_webp || c.size_max_808_webp || c.size_404_webp || {}).url, coverLg: (c.size_original_webp || c.size_808_webp || {}).url };
}

// ---- read the URL list ----
let lines = [];
try { lines = (await readFile(path.join(ROOT, "new-projects.txt"), "utf8")).split(/\r?\n/); } catch { console.error("Create new-projects.txt and paste the Behance URLs (one per line)."); process.exit(1); }
const wanted = lines.map(l => l.replace(/#.*/, "").trim()).filter(Boolean).map(l => { const [url, cat] = l.split("|").map(s => s.trim()); return { raw: l, url, id: idOf(url), cat }; });

const feed = await readWin(ROOT, "behance-projects.js", "BEHANCE_PROJECTS");
let added = await readWin(ROOT, "added-projects.js", "ADDED_PROJECTS");
const have = new Set([...feed, ...added].map(p => String(p.behanceId)));

const report = { when: new Date().toISOString(), requested: wanted.length, added: [], duplicates: [], failed: [] };
for (const w of wanted) {
  if (!w.id) { report.failed.push({ url: w.url, reason: "not a Behance project URL (expected …/gallery/<number>/<name>)" }); console.warn("✗ not a project URL:", w.raw); continue; }
  if (have.has(w.id)) { report.duplicates.push({ id: w.id, url: w.url }); console.log("↷ duplicate, skipped:", w.id); continue; }
  if (w.cat && !CATS.includes(w.cat)) { report.failed.push({ id: w.id, url: w.url, reason: `unknown category "${w.cat}" (use: ${CATS.join(", ")})` }); console.warn("✗ unknown category:", w.raw); continue; }
  try {
    const e = await embed(w.id);
    const cat = w.cat || guess(e.title);
    added.push({ id: "be-" + w.id, behanceId: w.id, title: e.title, category: cat, categories: [cat], year: "", shape: e.cover ? shapeOf(e.cover) : "landscape",
      cover: e.cover || "", coverLg: e.coverLg || "", images: [], link: e.url || w.url, embed: `https://www.behance.net/embed/project/${w.id}?ilo0=1`, addedAt: new Date().toISOString() });
    have.add(w.id); report.added.push({ id: w.id, title: e.title, category: cat, categoryFrom: w.cat ? "your override" : "title keywords" });
    console.log(`✓ added ${w.id} “${e.title}” → ${cat}`);
  } catch (err) { report.failed.push({ id: w.id, url: w.url, reason: err.message }); console.warn(`✗ ${w.id}: ${err.message}`); }
}

await writeFile(path.join(ROOT, "added-projects.js"), `/* AUTO-GENERATED by tools/add-projects.mjs — projects added by URL. */\nwindow.ADDED_PROJECTS = ${JSON.stringify(added, null, 2)};\n`);
await writeFile(path.join(ROOT, "add-report.json"), JSON.stringify(report, null, 2));

// ---- generate the browser snippet limited to the NEW projects ----
if (report.added.length) {
  const base = await readFile(path.join(HERE, "tools/behance-console-snippet.js"), "utf8");
  const a = base.indexOf("  // 1. load the whole profile"), bEnd = base.indexOf("  log(`found ${links.size} projects on the profile`);");
  if (a < 0 || bEnd < 0) { console.error("Could not build browser-snippet-new.js (template changed)."); process.exit(1); }
  const urls = Object.fromEntries(report.added.map(p => [p.id, `https://www.behance.net/gallery/${p.id}`]));
  const body = base.slice(0, a) + `  // 1. ONLY the project URLs listed above are opened (nothing else)
  if (location.hostname !== "www.behance.net") { console.log("Open any page on https://www.behance.net first, then paste this again."); return; }
  const links = new Map(Object.entries(NEW_URLS));
  log(\`\${links.size} project(s) to export\`);` + base.slice(bEnd + "  log(`found ${links.size} projects on the profile`);".length);
  const out = body.replace("(async () => {", `const NEW_URLS = ${JSON.stringify(urls, null, 2)};   // <- the only pages this script will request\n(async () => {`)
    .replace(/RUN THIS IN YOUR OWN BROWSER[^\n]*\n[\s\S]*?\n   It only reads/, "RUN THIS IN YOUR OWN BROWSER — NEW PROJECTS ONLY (generated by tools/add-projects.mjs)\n   Open ANY page on https://www.behance.net, open the console, paste this whole file, Enter.\n   It exports only the projects in NEW_URLS below. Then run: node tools/import-assets.mjs\n   It only reads")
  await mkdir(path.join(ROOT, "tools"), { recursive: true });
  await writeFile(path.join(ROOT, "tools/browser-snippet-new.js"), out);
}

console.log(`\n==== ADD REPORT ====`);
console.log(`URLs in new-projects.txt:   ${wanted.length}`);
console.log(`New projects added:         ${report.added.length}`);
console.log(`Duplicates skipped:         ${report.duplicates.length}`);
console.log(`Failed:                     ${report.failed.length}${report.failed.length ? "\n  " + report.failed.map(f => `${f.id || f.url}: ${f.reason}`).join("\n  ") : ""}`);
if (report.added.length) console.log(`\nThey now show on the site with their cover. For the FULL images: run tools/browser-snippet-new.js in Chrome,\nthen: node tools/import-assets.mjs   (until then they show "full presentation not imported yet").`);

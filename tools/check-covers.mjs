#!/usr/bin/env node
/* Cover audit:  node tools/check-covers.mjs
   Checks every project's cover individually (real image / loads / Behance "blocked" placeholder)
   and writes cover-report.json. Never modifies any project. */
import { readFile, writeFile } from "node:fs/promises"; import vm from "node:vm"; import path from "node:path"; import { fileURLToPath } from "node:url";
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const L = async (f, k) => { try { const c = { window: {} }; vm.runInNewContext(await readFile(path.join(R, f), "utf8"), c); return c.window[k] || c.window; } catch { return []; } };
const feed = await L("behance-projects.js", "BEHANCE_PROJECTS"), add = await L("added-projects.js", "ADDED_PROJECTS"), loc = await L("projects-local.js", "LOCAL_PROJECTS");
const ov = (await L("projects.js", "SITE")).overrides || {};
const rows = [];
for (const [src, list] of [["original", feed], ["added", add]]) for (const p of list) {
  const o = ov["be-" + p.behanceId] || {}, l = (Array.isArray(loc) ? loc : []).find(x => String(x.behanceId) === String(p.behanceId));
  const cover = o.cover || (l && (l.cover || (l.images[0] || {}).src)) || p.cover || "";
  const blocked = /-blocked\./.test(cover); let status = "none";
  if (cover) { if (/^https?:/.test(cover)) { try { status = (await fetch(cover, { headers: { "User-Agent": "Mozilla/5.0" } })).status; } catch { status = "error"; } } else { try { await readFile(path.join(R, cover)); status = 200; } catch { status = "missing-file"; } } }
  const ok = status === 200 && !blocked;
  rows.push({ source: src, id: p.behanceId, title: p.title, cover: ok ? (o.cover ? "your image (override)" : "original Behance cover") : "NONE", status: ok ? "OK" : blocked ? "blocked by Behance (mature-content project)" : `failed (${status})` });
}
const missing = rows.filter(r => r.status !== "OK");
await writeFile(path.join(R, "cover-report.json"), JSON.stringify({ when: new Date().toISOString(), total: rows.length, withRealCover: rows.length - missing.length, missing, all: rows }, null, 2));
console.log(`Projects checked:        ${rows.length}\nReal artwork loads:      ${rows.length - missing.length}\nNo real cover available: ${missing.length}`);
missing.forEach(m => console.log(`  - ${m.id} ${m.title}: ${m.status}`));
console.log("Saved: cover-report.json");

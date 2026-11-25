# Add missing Behance projects (your existing 12 stay untouched)

Behance blocks automated tools from reading project pages, so the FULL images are exported in your own
browser. Titles and covers are fetched automatically.

## 1. Paste the URLs
Open `new-projects.txt` and paste the Behance URL of each missing project, one per line.
Optional category: `URL | social` (keys: brand social print posters packaging food football motion video web other).

## 2. Add them
```
node tools/add-projects.mjs
```
- Duplicates (your 12 existing projects, earlier additions, repeated lines) are skipped.
- Each new project gets its real title + cover and a category (guessed from the title, or your override),
  and appears on the site immediately with its own project page.
- It prints an **ADD REPORT** (added / duplicates / failed) and saves `add-report.json`.
- It writes `tools/browser-snippet-new.js` — a snippet that exports ONLY these projects.

## 3. Export their full images (in Chrome)
1. Open any page on https://www.behance.net.
2. Open the console (Cmd+Option+J), paste the whole of `tools/browser-snippet-new.js`, press Enter.
   (Read it first: it only requests the project pages listed at its top, reads no cookies/passwords/tokens,
   and its only output is a local file `behance-dump.json`. If Chrome asks, type `allow pasting`.)
3. When it says DONE, move `behance-dump.json` into the website folder.

## 4. Import the images
```
node tools/import-assets.mjs
```
Downloads every image (best quality, original order, original proportions) into
`projects/<category>/<project>/` and prints the **IMPORT REPORT**: new projects completed, projects with
missing images, failures, images imported, projects per category. Saved to `import-report.json`.
The 12 original projects are left untouched.

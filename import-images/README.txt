PUT YOUR DOWNLOADED BEHANCE IMAGES HERE
=======================================

One folder per project. Drop that project's images into its folder:

  import-images/155583463-a-company-that-sells-modern-sportswear/
  import-images/219515885-social-media-design/
  import-images/230189267-social-media-design/
  import-images/233969745-storm-sports-academy/
  import-images/234962725-football-design/
  import-images/235651665-menu-restaurant/

Rules
  - ORDER = file-name order. Name them 01.jpg, 02.jpg, 03.jpg ... (or keep Behance's own numbering).
    Numbers sort naturally: 2.jpg comes before 10.jpg.
  - The FIRST image becomes the project's cover.
  - Accepted: .jpg .jpeg .png .webp .gif  (videos: .mp4 .webm .mov)
  - Do not rename or move the folders — the number at the start is how the tool finds the project.
  - Two folders are both called "social-media-design"; the number in front tells them apart.

When the images are in place, run (in Terminal, from the site folder):

  node tools/import-local.mjs --status     (optional: shows which folders are ready; changes nothing)
  node tools/import-local.mjs              (imports them)

Then hard-refresh the site: Cmd+Shift+R.

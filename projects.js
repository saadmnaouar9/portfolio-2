/* =========================================================================
   projects.js  —  YOUR CONTENT DATABASE (edit this file, not the website)
   -------------------------------------------------------------------------
   Projects come from two places:
     A) behance-projects.js  → auto-imported from Behance (node tools/import-behance.mjs)
     B) SITE.projects below  → projects you add by hand (with your own images)

   To CHANGE anything about an imported project, add an entry in SITE.overrides
   using its id ("be-<behance id>"). Fields you can set (all optional):
     title        rename it
     categories   ["brand","social"]  → one or more category keys (see list below)
     description  text shown on the project page
     images       ["assets/projects/x/01.jpg", ...]  → native gallery, in this order
                  (when set, shown INSTEAD of the Behance embed; drag order = array order)
     video        "assets/projects/x/demo.mp4" or a YouTube/Vimeo embed URL
     featured     true  → pinned first + "Featured" badge
     hidden       true  → hide it without deleting
     order        number → manual position (lower = earlier)
   To DELETE an imported project for good: set hidden:true.
   ========================================================================= */

window.SITE = {
  name: "Saad Mnaouar",

  /* ---------- CONTACT & SOCIAL (edit these) ---------- */
  contact: {
    email: "hello@yourdomain.com",          // ← your real email
    whatsapp: "212600000000",               // ← country code + number, digits only
    behance: "https://www.behance.net/yourprofile",
    instagram: "https://www.instagram.com/yourprofile",
    linkedin: "https://www.linkedin.com/in/yourprofile",
    // Optional: paste a Formspree / Getform endpoint to send the form directly.
    // Leave "" to open the visitor's email app instead.
    formEndpoint: ""
  },

  /* ---------- ABOUT STATS (edit to your real numbers) ---------- */
  stats: [
    { value: 5,   suffix: "+", label: "Years of experience" },
    { value: 100, suffix: "+", label: "Projects delivered" },
    { value: 40,  suffix: "+", label: "Brands & clients" },
    { value: 10,  suffix: "",  label: "Creative services" }
  ],

  /* ---------- CATEGORIES (edit labels / blurbs / order freely) ---------- */
  categories: [
    { key: "brand", image: "assets/categories/brand.webp",     num: "01", label: "Brand Identity",             tone: 3, art: "branding",  blurb: "Logos, visual identities, brand guidelines and rebrands that give companies a face people remember." },
    { key: "social", image: "assets/categories/social.webp",    num: "02", label: "Social Media Design",        tone: 1, art: "social",    blurb: "Posts, carousels, campaigns and promotional visuals built to stop the scroll." },
    { key: "print", image: "assets/categories/print.webp",     num: "03", label: "Print Design",               tone: 2, art: "ads",       blurb: "Business cards, brochures, catalogues, roll-ups, banners and printed advertising." },
    { key: "posters", image: "assets/categories/posters.webp",   num: "04", label: "Posters & Flyers",           tone: 0, art: "posters",   blurb: "Posters and flyers for events, promotions and announcements that read instantly." },
    { key: "packaging", image: "assets/categories/packaging.webp", num: "05", label: "Packaging & Product Design", tone: 1, art: "packaging", blurb: "Packaging, product mockups and commercial visuals that sell on the shelf." },
    { key: "food", image: "assets/categories/food.webp",      num: "06", label: "Food & Beverage",            tone: 3, art: "food",      blurb: "Appetising visuals for restaurants, food brands and beverage campaigns." },
    { key: "football", image: "assets/categories/football.webp",  num: "07", label: "Football & Sports Design",   tone: 0, art: "football",  blurb: "Matchday graphics, player designs and sports campaigns with energy." },
    { key: "motion", image: "assets/categories/motion.webp",    num: "08", label: "Motion Graphics & AI Videos",tone: 1, art: "motion",    blurb: "Animated adverts, motion graphics and creative AI video projects." },
    { key: "video", image: "assets/categories/video.webp",     num: "09", label: "Video Editing",              tone: 2, art: "video",     blurb: "Commercial and promotional videos, cut with rhythm." },
    { key: "web", image: "assets/categories/web.webp",       num: "10", label: "Web Design & UI/UX",         tone: 3, art: "web",       blurb: "Websites, landing pages and digital interfaces designed around users." },
    { key: "other", image: "assets/categories/other.webp",     num: "11", label: "Other Creative Projects",    tone: 1, art: "other",     blurb: "Everything else that doesn't fit a box." }
  ],

  /* ---------- EDITS TO IMPORTED PROJECTS (classified by viewing each cover) ---------- */
  overrides: {
    "be-154539385": { cover: "assets/covers/sam-travel.jpg", coverLg: "assets/covers/sam-travel.jpg", shape: "landscape" }, // SAM travel — your own cover image
    "be-243361355": { categories: ["brand", "food"],        featured: true },   // BaitTaam — logo on food visual
    "be-246912965": { categories: ["football"],             featured: true },   // football design
    "be-249928177": { categories: ["brand"],                featured: true },   // POWER FITNESS — gym logo
    "be-245982063": { categories: ["social"] },                                 // HR / corporate posts
    "be-245983973": { categories: ["social", "football"] },                     // sports club post mockups
    "be-245984793": { categories: ["social"] },                                 // Eid + travel posts
    "be-246403759": { categories: ["social"] },                                 // beauty salon posts
    "be-246404349": { categories: ["social"] },                                 // travel agency posts
    "be-246920583": { categories: ["social"] },                                 // laundry service posts
    "be-246976307": { categories: ["social", "food"] },                         // restaurant posts
    "be-256991643": { categories: ["social", "food"] },                         // food-product posts
    "be-256991897": { categories: ["social"] }                                  // real-estate posts
  },

  /* ---------- PROJECTS YOU ADD BY HAND (with your own images) ----------
  Example — copy, uncomment, edit:
  { id: "my-logo-1", title: "Brand Name", categories: ["brand"], year: "2026", shape: "portrait",
    cover: "assets/projects/my-logo-1/cover.jpg",
    images: ["assets/projects/my-logo-1/01.jpg", "assets/projects/my-logo-1/02.jpg"],
    description: "Short story about the brief and result.", featured: false, hidden: false }
  shape: "landscape" | "portrait" | "square" | "wide"                         */
  projects: []
};

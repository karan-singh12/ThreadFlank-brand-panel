// All copy and list data for the landing page. Replace values here —
// components read only from this file. Icon names map to src/lib/icons.tsx.
// Image fields accept a path under /public; leave empty to render the
// built-in gradient placeholder for that slot.

export const brand = {
  name: "Threadflank",
  // Set NEXT_PUBLIC_LEGAL_ENTITY to the registered company name (e.g. "Threadflank Technologies Pvt Ltd").
  copyright: `© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_LEGAL_ENTITY || "Threadflank"}. All rights reserved.`,
};

export const nav = {
  links: [
    { label: "How it works", href: "#how" },
    { label: "Features", href: "#features" },
    { label: "Try-on widget", href: "#brands" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "/contact" },
  ],
  login: { label: "Brand login", href: "/login" },
  cta: { label: "List your brand", href: "/signup" },
  signedInCta: { label: "Open dashboard", href: "/dashboard" },
};

export const hero = {
  tickerItems: ["Catalog at scale", "Collections", "Virtual try-on", "Launch drops", "AI Studio", "Shopper insights"],
  leftBlurb: "Add your whole catalog, hundreds of pieces at a time, and let shoppers see every one on themselves before they head to your store to buy.",
  rightBlurb: "Group pieces into collections, schedule launch drops with waitlists, write copy with AI and watch which garments get tried on most.",
  title: "Your catalog, tried on",
  primaryCta: { label: "List your brand", href: "/signup" },
  signedInPrimaryCta: { label: "Open dashboard", href: "/dashboard" },
  secondaryCta: { label: "How it works", href: "#how" },
};

/** The product mock under the hero: Threadflank's Drape studio. */
export const studio = {
  menu: [
    { label: "Discover", icon: "compass" },
    { label: "Drape", icon: "shirt", active: true },
    { label: "Wardrobe", icon: "layers" },
    { label: "Saved", icon: "heart" },
    { label: "Events", icon: "calendar-heart" },
    { label: "Messages", icon: "message-circle" },
  ],
  circle: { title: "Invite your circle", subtitle: "Style the two of you in one photo", people: ["/images/people/priya.jpg", "/images/people/arjun.jpg", "/images/people/maya.jpg"] },
  heading: "Drape studio",
  tabs: [
    { label: "Photo", icon: "camera" },
    { label: "Product link", icon: "link", active: true },
    { label: "Wardrobe", icon: "shirt" },
  ],
  lookTitle: "Relaxed camel trench",
  lookMeta: "Draped from your selfie in 12s · Studio light · Front pose",
  lookImage: "/images/look_office.png",
  garment: { label: "From link", image: "/images/trench_coat.png" },
  fitTag: "True to size",
  assistantToggle: "Hide stylist",
  link: {
    label: "Product link",
    text: "Paste a product link…",
  },
  filters: [
    { label: "Occasion", value: "Office" },
    { label: "Fit", value: "Relaxed" },
    { label: "Scene", value: "Studio" },
  ],
  completeLabel: "Complete the look",
  completeItems: ["/images/white_oxford.png", "/images/black_jeans.png", "/images/heel_pumps.png"],
  actions: [
    { label: "Save to my looks", icon: "heart" },
    { label: "Ask my circle to vote", icon: "users" },
  ],
  pills: ["Photo-real drape", "Works with any store", "Ready in seconds"],
};

export const mission = {
  // One entry per desktop line; lines reflow naturally on smaller screens.
  statementLines: [
    "Shoppers hesitate when they can't picture it.",
    "Threadflank puts every piece in your catalog",
    "on the shopper's own body, then sends them",
    "straight to your store to buy. You keep the sale,",
    "the customer and the price.",
  ],
  stat: { value: "500", label: ["garments in a single", "bulk action"] },
  categories: ["shirt", "footprints", "shopping-bag", "glasses", "gem", "watch", "crown", "scissors"],
};

export type FeatureCard = { id: string; icon: string; title: string; description: string };

export const features = {
  eyebrow: "Everything in one panel",
  title: "Built for brands with big catalogs",
  tabs: [
    {
      id: "try-on",
      label: "Try-on",
      icon: "wand-sparkles",
      cards: [
        { id: "link", icon: "link", title: "Try-on on your product pages", description: "Shoppers see your garment on themselves from your store or from Threadflank, then tap Buy to land on your site." },
        { id: "poses", icon: "camera", title: "Every angle", description: "Front, side and mid-stride views help shoppers judge the fit and cut down on returns." },
        { id: "scenes", icon: "sun", title: "Any scene", description: "Studio, daylight or festive lights: shoppers preview your piece where they will wear it." },
      ],
    },
    {
      id: "wardrobe",
      label: "Catalog",
      icon: "shirt",
      cards: [
        { id: "closet", icon: "layers", title: "Hundreds of pieces, organised", description: "Search, filter and sort 200 to 500 garments per brand, a page at a time, without the panel slowing down." },
        { id: "combos", icon: "wand-sparkles", title: "Collections", description: "Group pieces into editions, tag occasions and move many garments between collections in one step." },
        { id: "value", icon: "wallet", title: "Know what works", description: "Try-ons and buy clicks per garment show what shoppers reach for and what is gathering dust." },
      ],
    },
    {
      id: "together",
      label: "Growth",
      icon: "users",
      cards: [
        { id: "circle", icon: "users", title: "Shared by shoppers", description: "Shoppers send looks to friends and family, so one try-on of your piece reaches more people." },
        { id: "events", icon: "calendar-heart", title: "Launch drops", description: "Schedule a drop, collect a waitlist, and tell shoppers when it goes live." },
        { id: "vote", icon: "thumbs-up", title: "Stand out on Discover", description: "Bid for a Runway slot to put your collection at the top of Discover for a period." },
      ],
    },
  ],
  // Visual props for each card's mini illustration.
  scenes: [
    { id: "studio", label: "Studio", image: "/images/scenes/studio.svg" },
    { id: "daylight", label: "Daylight", image: "/images/scenes/daylight.svg" },
    { id: "sunset", label: "Sunset terrace", image: "/images/scenes/sunset.svg" },
    { id: "garden", label: "Garden", image: "/images/scenes/garden.svg" },
    { id: "city", label: "City street", image: "/images/scenes/city.svg" },
    { id: "festive", label: "Festive lights", image: "/images/scenes/festive.svg" },
  ],
  closet: ["/images/white_oxford.png", "/images/silk_blouse.png", "/images/blazer.png", "/images/black_jeans.png", "/images/floral_dress.png", "/images/white_sneakers.png"],
  combo: ["/images/graphic_tee.png", "/images/black_jeans.png", "/images/white_sneakers.png"],
  // Same outfit in every frame; "flip" mirrors the shot for the walking angle.
  poses: [
    { label: "Front", image: "/images/look_office.png", flip: false },
    { label: "Side", image: "/images/look_formal.png", flip: false },
    { label: "Walk", image: "/images/look_office.png", flip: true },
  ],
  circle: [
    { name: "Priya", image: "/images/people/priya.jpg" },
    { name: "Arjun", image: "/images/people/arjun.jpg" },
    { name: "You", image: "/images/people/maya.jpg" },
  ],
  event: { day: "12", month: "DEC", title: "Sangeet night", locked: "4 of 5 looks locked" },
  vote: { image: "/images/look_party.png", up: 4, down: 1 },
  value: [
    { label: "Sneakers", perWear: "₹187", pct: 92 },
    { label: "Jeans", perWear: "₹96", pct: 78 },
    { label: "Trench", perWear: "—", pct: 6 },
  ],
};

export const howItWorks = {
  eyebrow: "How it works",
  title: ["From signup to first sale", "in three simple steps"],
  tools: ["shirt", "shopping-bag", "footprints", "glasses", "gem", "watch"],
  steps: [
    {
      id: "twin",
      eyebrow: "Step 1 · Your brand",
      eyebrowIcon: "scan-face",
      title: "Set up your brand",
      description:
        "Create your account, verify your email and add your logo, story and website. Once the team approves your brand, your store page goes live on Threadflank.",
    },
    {
      id: "looks",
      eyebrow: "Step 2 · Catalog",
      eyebrowIcon: "wand-sparkles",
      title: "Add your garments",
      description:
        "Add pieces with a photo, price, category and buy link, and group them into collections. Pieces with a clear photo are ready for try-on straight away.",
    },
    {
      id: "decide",
      eyebrow: "Step 3 · Sell",
      eyebrowIcon: "thumbs-up",
      title: "Shoppers try on, then buy from you",
      description:
        "Shoppers drape your pieces on themselves and tap Buy to reach your own website. You see the numbers on your dashboard.",
    },
  ],
  twin: {
    photo: "/images/people/priya.jpg",
    tooltip: { label: "Store ready", value: "Logo · Story · Website", percent: "100%" },
    rows: [
      { label: "Brand profile", value: "Logo, story", status: "Set", color: "#6645eb" },
      { label: "Website", value: "Buy links", status: "Set", color: "#a99bff" },
      { label: "Verification", value: "Email", status: "Done", color: "#ffffff" },
    ],
  },
  looks: {
    promptLabel: "Plan a launch",
    prompt: "Put the Wedding Edit live on Friday evening, open the waitlist now and feature three hero pieces.",
    outputs: [
      { label: "Wedding Edit", image: "/images/look_office.png", tone: "ember" },
      { label: "Festive Capsule", image: "/images/look_party.png", tone: "meadow" },
      { label: "Resort Break", image: "/images/look_brunch.png", tone: "dusk" },
    ],
  },
  decide: {
    filters: [
      { label: "Collection", value: "Wedding Edit" },
      { label: "Category", value: "Ethnic Wear" },
      { label: "Status", value: "Live" },
    ],
    suggestedLabel: "Top pieces this week",
    images: [
      { image: "/images/feed/rangrez-saree.jpg", tone: "ember" },
      { image: "/images/brands/rangrez.jpg", tone: "neon" },
    ],
    actions: [
      { label: "Open the waitlist", icon: "users" },
      { label: "Schedule the drop", icon: "calendar-heart" },
    ],
  },
};

export const forBrands = {
  eyebrow: "Try-on widget",
  title: "Try-on on every product page",
  intro: [
    { text: "Add Threadflank's ", strong: false },
    { text: "try-on widget to your own store with one line of code", strong: true },
    { text: ", and let shoppers see your pieces on themselves before they check out.", strong: false },
  ],
  outro: [
    { text: "Your catalog also lives on Threadflank", strong: true },
    { text: " — a virtual store page and Discover shelves put your collections in front of shoppers who can try them on in one tap.", strong: false },
  ],
  outerApps: [
    { icon: "store", size: 108 },
    { icon: "tag", size: 50 },
    { icon: "shopping-bag", size: 50 },
  ],
  innerApps: [
    { icon: "shirt", size: 82 },
    { icon: "code", size: 64 },
    { icon: "chart-square", size: 54 },
  ],
  cards: [
    {
      icon: "code",
      title: "One-line install",
      description: "Drop our script on Shopify or any custom storefront. Allow your domains and rotate the key from Settings whenever you need.",
      side: "left",
    },
    {
      icon: "chart-square",
      title: "Per-piece numbers",
      description: "See store views, try-ons and buy clicks for the brand and for each garment, and find what shoppers reach for.",
      side: "right",
    },
    {
      icon: "building-2",
      title: "Your team, your store",
      description: "Invite managers to the panel. Every buy link goes to your own website, so orders and payments stay with you.",
      side: "left",
    },
  ],
  primaryCta: { label: "List your brand", href: "/signup" },
  secondaryCta: { label: "Brand pricing", href: "/pricing?for=brands" },
};

export const empower = {
  eyebrow: "Made for real catalogs",
  title: "Scale, sorted",
  cards: {
    speed: {
      title: "Fast at any size",
      description: "The catalog loads a page at a time and searches on the server, so a brand with 500 garments stays quick.",
      apps: ["shirt", "shopping-bag", "gem", "footprints", "glasses"],
    },
    vote: {
      title: "Shoppers decide faster",
      description: "Seeing a piece on themselves, then sharing it for a quick thumbs-up, helps shoppers commit to buying.",
      keys: ["thumbs-up", "thumbs-down"],
      badge: "4 of 5 love it",
    },
    stores: ["store", "tag", "shopping-bag", "link", "receipt", "wallet"],
    occasions: ["briefcase", "party-popper", "coffee", "plane", "calendar-heart", "sun"],
    scenes: {
      title: "Shown in every scene",
      description: "Studio, daylight, terrace, garden, city street or festive lights: shoppers see your piece where they will wear it.",
      icons: ["sun", "camera", "film", "palette"],
    },
    value: {
      title: "Know your best sellers",
      description: "Try-ons and buy clicks per garment show what works, so you can restock and promote with confidence.",
      value: "₹630",
      unit: "per wear",
      change: "18%",
    },
    discover: {
      title: "Get discovered",
      description: "Your live pieces show up on Discover shelves and your store page, each one a tap away from a try-on.",
      query: "Linen co-ords for a beach wedding",
      tags: ["Ethnic", "Streetwear", "Minimal"],
    },
  },
};

export const pricing = {
  eyebrow: "Pricing",
  title: "Plans for brands",
  unitOnce: "ONE-TIME",
  notes: { free: "Free, no card needed", once: "Pay once · credits never expire" },
  allPlans: { label: "Compare plans & FAQs", href: "/pricing?for=brands" },
};

export const finalCta = {
  title: ["Your next collection,", "tried on first"],
  description: "Create your brand account, add your garments and go live on Threadflank. Start in minutes, no card needed.",
  primaryCta: { label: "List your brand", href: "/signup" },
  signedInPrimaryCta: { label: "Open dashboard", href: "/dashboard" },
  secondaryCta: { label: "Talk to sales", href: "/contact?topic=brands" },
};

export const footer = {
  columns: [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "#how" },
        { label: "Features", href: "#features" },
        { label: "Try-on widget", href: "#brands" },
        { label: "Pricing", href: "/pricing?for=brands" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Contact us", href: "/contact" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Terms & conditions", href: "/terms" },
        { label: "Disclaimer", href: "/disclaimer" },
      ],
    },
  ],
  newsletter: {
    label: "Get brand tips and product news",
    placeholder: "name@email.com",
    button: "Subscribe",
    success: "You're on the list — watch your inbox.",
  },
  followLabel: "Follow us on",
  // Add the real profile URLs; icons without an href are hidden.
  social: [
    { label: "X", icon: "x-social", href: "" },
    { label: "Instagram", icon: "instagram", href: "" },
    { label: "Discord", icon: "discord", href: "" },
  ],
  backToTop: "Back to top",
};

/** Feature-by-feature detail grid under the feature tabs. Describe only what the app does today. */
export const featureDetails = {
  eyebrow: "What you get",
  title: "Every part of the brand panel, in plain words",
  groups: [
    {
      icon: "layers",
      title: "Catalog at scale",
      points: [
        "Pieces load a page at a time, so 500 garments feel as quick as 20",
        "Search by name, SKU or collection, and filter by category, stock or visibility",
        "Sort by newest, most tried on, price or lowest stock",
        "Select many pieces to go live, hide, delete or move them in one step",
      ],
    },
    {
      icon: "store",
      title: "Collections & store page",
      points: [
        "Group pieces into collections such as Wedding Edit or Festive Capsule",
        "Feature up to 8 hero pieces on your store page",
        "Keep drafts hidden from shoppers until they are ready",
        "Every buy button opens your own website",
      ],
    },
    {
      icon: "shirt",
      title: "Try-on",
      points: [
        "Shoppers drape any garment with a clear photo on themselves",
        "See which pieces are try-on ready and which still need an image",
        "Add the widget to your product pages with one line of code",
        "Control which domains may load it",
      ],
    },
    {
      icon: "zap",
      title: "Launch drops",
      points: [
        "Schedule a drop with a date and a banner",
        "Shoppers join the waitlist before launch",
        "Edit or cancel a drop any time before it goes live",
        "See waitlist counts at a glance",
      ],
    },
    {
      icon: "wand-sparkles",
      title: "AI Studio",
      points: [
        "Write product descriptions, captions, announcements and emails",
        "Pick a garment from your catalog and edit the options before you use them",
        "Motion previews for your pieces",
        "Credits are shown in the panel; failed runs are not charged",
      ],
    },
    {
      icon: "chart-square",
      title: "Insights & visibility",
      points: [
        "Dashboard with store views, try-ons, saves, shares and buy clicks",
        "Top garments ranked across your whole catalog",
        "Bid for a Runway slot to be featured on Discover",
        "Invite your team and keep your account secure",
      ],
    },
  ],
};

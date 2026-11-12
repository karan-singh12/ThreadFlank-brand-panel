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
    { label: "For brands", href: "#brands" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "/contact" },
  ],
  login: { label: "Log in", href: "/login" },
  cta: { label: "Start free", href: "/signup" },
  signedInCta: { label: "Open app", href: "/drape" },
};

export const hero = {
  tickerItems: ["Virtual try-on", "Selfie to style", "Smart wardrobe", "Occasion planner", "Twin circle"],
  leftBlurb: "Take one selfie, add your height and build, and Threadflank drapes any outfit on you — from a brand's feed, a product link or your own closet.",
  rightBlurb: "Explore brand stores, plan looks for every occasion, track what each piece costs per wear and decide with your circle.",
  title: "See it on you first",
  primaryCta: { label: "Try it free", href: "/signup" },
  signedInPrimaryCta: { label: "Open Drape studio", href: "/drape" },
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
    "Getting dressed shouldn't be guesswork.",
    "Threadflank shows every outfit on your own body",
    "before you spend a rupee, keeps your wardrobe",
    "in your pocket, and brings the people you trust",
    "into every decision.",
  ],
  stat: { value: "<15s", label: ["to see any outfit", "on yourself"] },
  categories: ["shirt", "footprints", "shopping-bag", "glasses", "gem", "watch", "crown", "scissors"],
};

export type FeatureCard = { id: string; icon: string; title: string; description: string };

export const features = {
  eyebrow: "Everything in one app",
  title: "Your stylist, in your pocket",
  tabs: [
    {
      id: "try-on",
      label: "Try-on",
      icon: "wand-sparkles",
      cards: [
        { id: "link", icon: "link", title: "Try on from any link", description: "Paste a product page from any store — Threadflank pulls the garment and drapes it on you." },
        { id: "poses", icon: "camera", title: "Poses & motion", description: "Check the fit from the side, the back or mid-stride — even as a short clip." },
        { id: "scenes", icon: "sun", title: "Any scene", description: "Studio, sunset terrace or festive lights — preview the look where you'll wear it." },
      ],
    },
    {
      id: "wardrobe",
      label: "Wardrobe",
      icon: "shirt",
      cards: [
        { id: "closet", icon: "layers", title: "Your closet, digitized", description: "Snap your clothes once, then mix them into looks whenever you like." },
        { id: "combos", icon: "wand-sparkles", title: "AI outfit combos", description: "Name the occasion — Threadflank builds outfits from what you already own." },
        { id: "value", icon: "wallet", title: "Cost per wear", description: "See what each piece really costs you, and what's gathering dust." },
      ],
    },
    {
      id: "together",
      label: "Together",
      icon: "users",
      cards: [
        { id: "circle", icon: "users", title: "Twin circle", description: "Add your partner, family or best friend, then see the two of you styled together in one photo." },
        { id: "events", icon: "calendar-heart", title: "Plan every occasion", description: "Weddings, sangeets, parties — everyone locks in their look in one place." },
        { id: "vote", icon: "thumbs-up", title: "Vote & stylist notes", description: "Share a look for a quick vote, or ask a verified stylist for honest notes." },
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
  title: ["From selfie to perfect fit", "in three simple steps"],
  tools: ["shirt", "shopping-bag", "footprints", "glasses", "gem", "watch"],
  steps: [
    {
      id: "twin",
      eyebrow: "Step 1 · Your selfie",
      eyebrowIcon: "scan-face",
      title: "Take one selfie",
      description:
        "Snap a clear selfie (or pick one from your gallery) and add your height, weight and skin tone. That's all Threadflank needs to put you in any outfit — your face comes straight from your photo.",
    },
    {
      id: "looks",
      eyebrow: "Step 2 · Drape",
      eyebrowIcon: "wand-sparkles",
      title: "See looks for every plan",
      description:
        "Describe your week or paste a product link. Threadflank drapes each outfit on you — photo-real, true to the fabric and the fit.",
    },
    {
      id: "decide",
      eyebrow: "Step 3 · Decide",
      eyebrowIcon: "thumbs-up",
      title: "Decide together, buy once",
      description:
        "Share the shortlist with your circle, lock in the winner for the event, and only buy what you'll actually wear.",
    },
  ],
  twin: {
    photo: "/images/people/priya.jpg",
    tooltip: { label: "Selfie ready", value: "Face · Build · Tone", percent: "100%" },
    rows: [
      { label: "Height", value: "165 cm", status: "Set", color: "#6645eb" },
      { label: "Weight", value: "58 kg", status: "Set", color: "#a99bff" },
      { label: "Skin tone", value: "Medium", status: "Matched", color: "#ffffff" },
    ],
  },
  looks: {
    promptLabel: "Plan my week",
    prompt: "Office on Monday, a date on Friday and brunch on Sunday — use my trench and white sneakers.",
    outputs: [
      { label: "Office", image: "/images/look_office.png", tone: "ember" },
      { label: "Date night", image: "/images/look_party.png", tone: "meadow" },
      { label: "Brunch", image: "/images/look_brunch.png", tone: "dusk" },
    ],
  },
  decide: {
    filters: [
      { label: "Occasion", value: "Sangeet" },
      { label: "Dress code", value: "Ethnic" },
      { label: "Budget", value: "₹5,000" },
    ],
    suggestedLabel: "Shortlist for the sangeet",
    images: [
      { image: "/images/feed/rangrez-saree.jpg", tone: "ember" },
      { image: "/images/brands/rangrez.jpg", tone: "neon" },
    ],
    actions: [
      { label: "Ask my circle to vote", icon: "users" },
      { label: "Lock in for the event", icon: "calendar-heart" },
    ],
  },
};

export const forBrands = {
  eyebrow: "For brands",
  title: "Try-on on every product page",
  intro: [
    { text: "Add Threadflank's ", strong: false },
    { text: "try-on widget to your store with one line of code", strong: true },
    { text: ", and let shoppers see your pieces on themselves before they check out.", strong: false },
  ],
  outro: [
    { text: "Post to the Threadflank feed too", strong: true },
    { text: " — brand stories and shoppable posts put your collection in front of people who can try it on in one tap.", strong: false },
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
      description: "Drop our script on Shopify or any custom storefront — a try-on button appears on every product page.",
      side: "left",
    },
    {
      icon: "chart-square",
      title: "Shopper insights",
      description: "See which products get tried on, where shoppers drop off and what brings them back.",
      side: "right",
    },
    {
      icon: "building-2",
      title: "White-label ready",
      description: "Run the drape engine under your own brand, tuned on your catalogue, with an SLA that fits.",
      side: "left",
    },
  ],
  primaryCta: { label: "Talk to sales", href: "/contact?topic=brands" },
  secondaryCta: { label: "Brand pricing", href: "/pricing?for=brands" },
};

export const empower = {
  eyebrow: "Made for real life",
  title: "Style, sorted",
  cards: {
    speed: {
      title: "Looks in seconds",
      description: "Most looks are back in seconds — one credit each, and a failed render never costs you one.",
      apps: ["shirt", "shopping-bag", "gem", "footprints", "glasses"],
    },
    vote: {
      title: "Vote before you buy",
      description: "Share any look with your circle for a quick thumbs-up — or a verified stylist's honest notes.",
      keys: ["thumbs-up", "thumbs-down"],
      badge: "4 of 5 love it",
    },
    stores: ["store", "tag", "shopping-bag", "link", "receipt", "wallet"],
    occasions: ["briefcase", "party-popper", "coffee", "plane", "calendar-heart", "sun"],
    scenes: {
      title: "You, in every scene",
      description: "Studio, daylight, sunset terrace, garden, city street or festive lights — see the look where you'll actually wear it.",
      icons: ["sun", "camera", "film", "palette"],
    },
    value: {
      title: "Know your cost per wear",
      description: "Track what you wear, spot the pieces gathering dust, and make every new buy count.",
      value: "₹630",
      unit: "per wear",
      change: "18%",
    },
    discover: {
      title: "Discover, then try on",
      description: "A feed of brands and trends where every post is one tap away from trying it on.",
      query: "Linen co-ords for a beach wedding",
      tags: ["Ethnic", "Streetwear", "Minimal"],
    },
  },
};

export const pricing = {
  eyebrow: "Pricing",
  title: "Simple, honest pricing",
  unitOnce: "ONE-TIME",
  notes: { free: "Free, no card needed", once: "Pay once · credits never expire" },
  allPlans: { label: "All credit packs, brand pricing & FAQs", href: "/pricing" },
};

export const finalCta = {
  title: ["Your next outfit,", "tried on first"],
  description: "Take a selfie and try on your first looks in a minute. Free to start — no card needed.",
  primaryCta: { label: "Try it free", href: "/signup" },
  signedInPrimaryCta: { label: "Open Drape studio", href: "/drape" },
  secondaryCta: { label: "Talk to sales", href: "/contact?topic=brands" },
};

export const footer = {
  columns: [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "#how" },
        { label: "Features", href: "#features" },
        { label: "For brands", href: "#brands" },
        { label: "Pricing", href: "/pricing" },
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
    label: "Get style drops and product news",
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
  title: "Every part of the app, in plain words",
  groups: [
    {
      icon: "shirt",
      title: "Drape studio",
      points: [
        "One selfie plus your height and build is all it takes",
        "Drape from a product link, a photo or a piece in your wardrobe",
        "Pick the scene, from studio light to festive lights",
        "Style yourself with one person from your circle in a single photo",
        "One credit per look, and failed renders are refunded",
      ],
    },
    {
      icon: "compass",
      title: "Discover",
      points: [
        "Fresh drops and shelves from brands on Threadflank",
        "Filter by category, or search outfits, brands and fabrics",
        "Tap Try on from any card to drape it on yourself",
        "Save looks and share them with friends",
      ],
    },
    {
      icon: "store",
      title: "Brands",
      points: [
        "Open a brand's store and browse its collections",
        "See every piece with its price and fabric",
        "Try any piece on before heading to the brand's own site",
        "Brands can add a try-on button to their product pages",
      ],
    },
    {
      icon: "layers",
      title: "My Wardrobe",
      points: [
        "Add your clothes once and sort them by category",
        "Mark what you wore and see cost per wear",
        "Spot pieces unworn for 90 days or more",
        "Insights show which pieces earn their place",
      ],
    },
    {
      icon: "wand-sparkles",
      title: "Outfit Planner",
      points: [
        "Choose the occasion: wedding, festive, office, date night and more",
        "For weddings, pick ceremonies like Haldi, Mehendi and Sangeet",
        "Add city, budget and dress code",
        "Build from your closet, mix in new pieces, or curate fresh",
      ],
    },
    {
      icon: "message-circle",
      title: "Together",
      points: [
        "Chat with friends and groups inside the app",
        "Share a look and get a quick vote",
        "Plan events so everyone locks in their outfit",
        "Ask a verified stylist for honest notes",
      ],
    },
  ],
};

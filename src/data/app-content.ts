// Copy and mock data for the signed-in app (Discover + Messages).
// Replace the mock arrays with API data later; components only read these shapes.

export const appNav = {
  /** Primary pages: centre of the top bar on desktop, mobile bottom navbar. */
  items: [
    { id: "discover", label: "Discover", href: "/discover", icon: "compass" },
    { id: "brands", label: "Brands", href: "/brands", icon: "store" },
    { id: "drape", label: "Drape", href: "/drape", icon: "shirt" },
    { id: "wardrobe", label: "Wardrobe", href: "/wardrobe", icon: "layers" },
    { id: "messages", label: "Messages", href: "/messages", icon: "message" },
  ],
  /** Profile menu entries for the signed-in person. */
  account: [
    { id: "saved", label: "Saved", href: "/saved", icon: "bookmark", also: ["/events"] },
    { id: "profile", label: "Profile", href: "/profile", icon: "user" },
    { id: "circle", label: "Twin circle", href: "/profile?tab=circle", icon: "users" },
    { id: "trending", label: "Trending", href: "/trending", icon: "flame" },
    { id: "stylist", label: "Stylist", href: "/stylist", icon: "scissors" },
  ],
  /** Secondary pages, also reachable by guests. */
  more: [
    { id: "pricing", label: "Pricing", href: "/pricing", icon: "gem" },
    { id: "contact", label: "Contact us", href: "/contact", icon: "mail" },
    { id: "terms", label: "Terms & conditions", href: "/terms", icon: "scroll" },
    { id: "disclaimer", label: "Disclaimer", href: "/disclaimer", icon: "shield" },
  ],
  menuLabel: "Account menu",
  moreLabel: "More",
  logout: "Sign out",
  login: "Log in",
  signup: "Get started",
};

// ─── Discover ────────────────────────────────────────────────────────────────

/** `hasStory`: active stories to watch; `hasNewStory`: some the viewer hasn't seen yet. */
export type Brand = { id: string; name: string; handle: string; tone: string; image?: string; verified: boolean; hasNewStory: boolean; hasStory?: boolean };

export type TaggedProduct = { name: string; price: string };

/** A size/colour of a tagged product, with live stock (feature #20). */
export type ProductVariant = { id: string; productName: string; size: string; color: string; colorHex: string | null; price: number | null; inStock: boolean; stockCount: number | null; productUrl: string | null; imageUrl: string | null };

export type PostComment = { id: string; author: string; text: string; userId?: string; avatar?: string | null; createdAt?: string; pending?: boolean };

export type BrandPost = {
  id: string;
  brandId: string;
  category: string;
  image: string;
  tone: string;
  caption: string;
  postedAgo: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  tags: TaggedProduct[];
  /** The newest comments shown under the post; `commentsCount` is the full total. */
  comments: PostComment[];
  commentsCount: number;
  variants?: ProductVariant[];
  publishedAt?: string;
};

export const discoverContent = {
  title: "Discover",
  description: "Fresh drops and looks from the brands you follow.",
  searchPlaceholder: "Search looks, brands, items…",
  allStoriesLabel: "All",
  categories: ["All", "Ethnic", "Streetwear", "Minimal", "Formal", "Athleisure", "Vintage"],
  shopLabel: "Shop the look",
  commentPlaceholder: "Add a comment…",
  postButton: "Post",
  viewComments: (n: number) => (n === 1 ? "View 1 comment" : `View all ${n} comments`),
  likes: (n: number) => (n === 1 ? "1 like" : `${n.toLocaleString()} likes`),
  loadingComments: "Loading comments…",
  deleteComment: "Delete comment",
  savedNote: "Saved to your looks",
  unsavedNote: "Removed from your looks",
  openSaved: "Open Saved",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  openPost: "Open post page",
  tryOn: "Try it on",
  emptyTitle: "No matching looks",
  emptyDescription: "Try another brand, category or search term.",
  suggestedTitle: "Suggested brands",
  follow: "Follow",
  trendingTitle: "Trending now",
  trending: ["#oversized", "#earthtones", "#linen", "#monochrome", "#y2k", "#tailoring"],
};

export const brands: Brand[] = [];

export const brandPosts: BrandPost[] = [];

// ─── Messages ────────────────────────────────────────────────────────────────

export type ChatMessage = { id: string; fromMe: boolean; text: string; time: string };

export type Conversation = {
  id: string;
  name: string;
  handle: string;
  tone: string;
  image?: string;
  online: boolean;
  unread: number;
  lastMessage: string;
  lastAt: string;
  isGroup?: boolean;
  members?: number;
  messages: ChatMessage[];
};

export type Friend = { id: string; name: string; handle: string; tone: string; image?: string; online: boolean };

export const messagesContent = {
  title: "Messages",
  tabs: { chats: "Chats", friends: "Friends" },
  searchChats: "Search chats…",
  searchFriends: "Search friends…",
  newChat: "New message",
  online: "Online",
  offline: "Offline",
  members: (n: number) => `${n} members`,
  inputPlaceholder: (name: string) => `Message ${name.split(/\s+/)[0]}…`,
  send: "Send",
  typing: "typing…",
  today: "Today",
  startChat: "Message",
  emptyTitle: "No chat selected",
  emptyDescription: "Pick a conversation or start a new one with a friend.",
  noResults: "No results",
};

export const conversations: Conversation[] = [];

export const friends: Friend[] = [];

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "https://threadflank-ai-backend.onrender.com/api" : "http://localhost:3003/api")).replace(/\/+$/, "");

export const API_TIMEOUT_MS = 15_000;

/** Backend origin without the /api prefix; uploads are served from `${ASSET_ORIGIN}/public/…`. */
export const ASSET_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

/** `<account>.r2.cloudflarestorage.com` (bucket in the path) or `<bucket>.<account>.r2.cloudflarestorage.com`. */
const R2_API_HOST = /^(?:([a-z0-9][a-z0-9-]*)\.)?[0-9a-f]{32}\.r2\.cloudflarestorage\.com$/i;

/**
 * Uploads saved with the bucket's S3 API URL can't be opened by a browser (that endpoint only
 * answers signed requests), so they're read through the backend's public /api/media route.
 */
function viaMediaRoute(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const host = R2_API_HOST.exec(parsed.hostname);
  if (!host) return url;
  const segments = parsed.pathname.replace(/^\/+/, "").split("/");
  const key = (host[1] ? segments : segments.slice(1)).join("/");
  return key ? `${ASSET_ORIGIN}/api/media/${key}` : url;
}

/**
 * Turns a backend upload path (`/public/…`) into an absolute URL. Other root paths
 * (`/images/…`, the web app's own static files) stay on this origin; private R2 URLs go
 * through the backend's media route; other absolute, data: and blob: URLs pass through.
 */
export function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^https?:/.test(path)) return viaMediaRoute(path);
  if (/^(data:|blob:)/.test(path)) return path;
  if (path.startsWith("/") && !path.startsWith("/public/")) return path;
  return `${ASSET_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_URL ?? ASSET_ORIGIN).replace(/\/+$/, "");

/** Every backend route the web app calls, in one place. */
export const ENDPOINTS = {
  auth: {
    login: "/user/auth/login",
    signup: "/user/auth/signup",
    forgotPassword: "/user/auth/forgot-password",
    resetPassword: "/user/auth/reset-password",
    verifyEmail: "/user/auth/verify-email",
    resendVerification: "/user/auth/resend-verification",
  },
  users: {
    profile: "/users/profile",
    friends: {
      list: "/users/friends/list",
      requests: "/users/friends/requests",
      request: "/users/friends/request",
      respond: (id: string) => `/users/friends/requests/${id}`,
      remove: (friendId: string) => `/users/friends/${friendId}`,
      suggestions: "/users/friends/suggestions",
    },
  },
  chat: {
    conversations: "/conversations",
    conversation: (id: string) => `/conversations/${id}`,
    conversationMessages: (id: string) => `/conversations/${id}/messages`,
    groups: "/groups",
    group: (id: string) => `/groups/${id}`,
    groupMessages: (id: string) => `/groups/${id}/messages`,
    groupMembers: (id: string) => `/groups/${id}/members`,
    groupMember: (id: string, userId: string) => `/groups/${id}/members/${userId}`,
    leaveGroup: (id: string) => `/groups/${id}/leave`,
    messages: "/messages",
    message: (id: string) => `/messages/${id}`,
    search: "/chat/search",
  },
  discover: {
    brands: "/brands",
    posts: "/brand-posts",
    post: (id: string) => `/brand-posts/${id}`,
    like: (id: string) => `/brand-posts/${id}/like`,
    share: (id: string) => `/brand-posts/${id}/share`,
    save: (id: string) => `/brand-posts/${id}/save`,
    comments: (id: string) => `/brand-posts/${id}/comments`,
    comment: (id: string, commentId: string) => `/brand-posts/${id}/comments/${commentId}`,
    stories: "/brand-stories",
    storyView: (id: string) => `/brand-stories/${id}/view`,
  },
  twin: "/twin",
  wardrobe: "/wardrobe",
  wardrobeAnalytics: "/wardrobe/analytics",
  wardrobeSimilar: "/wardrobe/similar",
  wardrobeWorn: (id: string) => `/wardrobe/${id}/worn`,
  looks: "/looks",
  look: (id: string) => `/looks/${id}`,
  lookReview: (id: string) => `/looks/${id}/review-request`,
  uploads: "/uploads",
  occasionPlanner: "/sdk/occasion-planner",
  wardrobeCombos: "/sdk/wardrobe-combos",
  circle: {
    root: "/circle",
    members: "/circle/members",
    member: (id: string) => `/circle/members/${id}`,
    invites: "/circle/invites",
    respond: (memberId: string) => `/circle/invites/${memberId}/respond`,
    leave: (circleId: string) => `/circle/${circleId}/leave`,
    wardrobe: (userId: string) => `/circle/wardrobe/${userId}`,
    borrow: "/circle/borrow",
    borrowAction: (id: string, action: string) => `/circle/borrow/${id}/${action}`,
  },
  events: {
    list: "/events",
    one: (id: string) => `/events/${id}`,
    plan: (id: string, planId: string) => `/events/${id}/plans/${planId}`,
    suggest: (id: string, planId: string) => `/events/${id}/plans/${planId}/suggest`,
    grwm: (id: string) => `/events/${id}/grwm`,
  },
  stylists: {
    me: "/stylists/me",
    queue: "/stylists/queue",
    comments: (lookId: string) => `/stylists/looks/${lookId}/comments`,
    comment: (id: string) => `/stylists/comments/${id}`,
  },
  share: {
    create: "/share",
    resolve: (token: string) => `/share/${token}`,
    open: (token: string) => `/share/${token}/open`,
  },
  notifications: {
    list: "/notifications",
    readAll: "/notifications/read-all",
    read: (id: string) => `/notifications/${id}/read`,
  },
  aiUsage: {
    report: "/ai/usage",
    me: "/ai/usage/me",
  },
  widget: {
    config: "/widget/config",
    session: "/widget/session",
  },
  cms: {
    get: (key: string) => `/cms/${key}`,
    list: "/cms",
  },
  contact: "/contact",
  /** Brand panel (post-login dashboard for brands). */
  brand: {
    auth: {
      login: "/brand/auth/login",
      register: "/brand/auth/register",
      refresh: "/brand/auth/refresh",
      logout: "/brand/auth/logout",
      me: "/brand/auth/me",
      verifyEmail: "/brand/auth/verify-email",
      resendVerification: "/brand/auth/resend-verification",
      forgotPassword: "/brand/auth/forgot-password",
      resetPassword: "/brand/auth/reset-password",
      changePassword: "/brand/auth/change-password",
    },
    profile: "/brand/profile",
    widget: "/brand/widget",
    taxonomy: "/brand/taxonomy",
    team: "/brand/team",
    catalog: "/brand/catalog",
    garment: (id: string) => `/brand/catalog/${id}`,
    analytics: { overview: "/brand/analytics/overview", trackClick: "/brand/analytics/track-click" },
    drops: "/brand/drops",
    bidding: { slots: "/brand/bidding/slots", bid: (rank: number) => `/brand/bidding/slots/${rank}/bid` },
    aiStudio: { presets: "/brand/ai-studio/presets", simulate: "/brand/ai-studio/simulate", content: "/brand/ai-studio/content" },
    upload: "/brand/upload/base64",
  },
  studio: {
    backgrounds: "/studio/backgrounds",
  },
} as const;


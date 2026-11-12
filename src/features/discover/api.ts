import { apiRequest, type ApiResponse } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import type { PostComment } from "@/data/app-content";

export interface ApiBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  category: string | null;
  isVerified: boolean;
  socialLinks?: Record<string, string> | null;
}

export interface ApiTaggedProduct {
  name: string;
  brand?: string;
  price: string;
  thumbnail?: string;
}

export interface ApiVariant {
  id: string;
  productName: string;
  size: string;
  color: string;
  colorHex: string | null;
  price: number | null;
  inStock: boolean;
  stockCount: number | null;
  productUrl: string | null;
  imageUrl: string | null;
}

export interface ApiBrandPost {
  variants?: ApiVariant[];
  id: string;
  brandId: string;
  title: string | null;
  caption: string;
  images: string[];
  category: string | null;
  taggedProducts: ApiTaggedProduct[] | null;
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  likedByMe: boolean;
  /** Saved to the viewer's Saved looks. */
  savedByMe?: boolean;
  /** The two newest comments, oldest first, for the preview under the post. */
  latestComments?: ApiPostComment[];
  publishedAt: string;
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    isVerified: boolean;
  };
}

export interface ApiBrandStory {
  id: string;
  brandId: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  viewsCount?: number;
  /** Whether the signed-in viewer has seen it. */
  viewed?: boolean;
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    isVerified: boolean;
  };
}

export interface ApiPostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  /** Public author fields; the API never sends emails with comments. */
  user?: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export const toPostComment = (c: ApiPostComment): PostComment => ({
  id: c.id,
  userId: c.userId,
  author: c.user?.username || "member",
  avatar: c.user?.avatar ?? null,
  text: c.content,
  createdAt: c.createdAt,
});

export const discoverApi = {
  /** Fetch all active partner brands */
  async listBrands(token?: string | null): Promise<ApiBrand[]> {
    try {
      const res = await apiRequest<ApiBrand[]>(ENDPOINTS.discover.brands, {
        token,
      });
      return res.data ?? [];
    } catch (err) {
      console.warn("Failed to load brands from API:", err);
      return [];
    }
  },

  /** Fetch published brand posts for discover/trending feed */
  async listBrandPosts(
    token?: string | null,
    params: { brandId?: string; category?: string; page?: number; limit?: number } = {}
  ): Promise<{ posts: ApiBrandPost[]; meta?: ApiResponse<ApiBrandPost[]>["meta"] }> {
    const query = new URLSearchParams();
    if (params.brandId) query.set("brandId", params.brandId);
    if (params.category && params.category !== "All") query.set("category", params.category);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    try {
      const res = await apiRequest<ApiBrandPost[]>(
        `${ENDPOINTS.discover.posts}${qs}`,
        { token }
      );
      return { posts: res.data ?? [], meta: res.meta };
    } catch (err) {
      console.warn("Failed to load brand posts from API:", err);
      return { posts: [] };
    }
  },

  /** Toggle like on a brand post */
  async toggleLike(
    token: string,
    postId: string
  ): Promise<{ liked: boolean; likesCount: number }> {
    const res = await apiRequest<{ liked: boolean; likesCount: number }>(
      ENDPOINTS.discover.like(postId),
      {
        method: "POST",
        token,
      }
    );
    return res.data;
  },

  /** Counts a share of a post (fire and forget). */
  async recordShare(token: string | null | undefined, postId: string): Promise<void> {
    await apiRequest<unknown>(ENDPOINTS.discover.share(postId), { method: "POST", token }).catch(() => undefined);
  },

  /** Save a brand post to the user's Saved looks, or remove it. */
  async toggleSave(token: string, postId: string): Promise<{ saved: boolean; lookId?: string }> {
    const res = await apiRequest<{ saved: boolean; lookId?: string }>(ENDPOINTS.discover.save(postId), { method: "POST", token });
    return res.data;
  },

  /** One published post, in the feed's shape. */
  async getPost(token: string | null | undefined, postId: string): Promise<ApiBrandPost> {
    return (await apiRequest<ApiBrandPost>(ENDPOINTS.discover.post(postId), { token })).data;
  },

  /** List comments on a brand post, oldest first. */
  async listComments(token: string | null | undefined, postId: string): Promise<ApiPostComment[]> {
    const res = await apiRequest<ApiPostComment[]>(ENDPOINTS.discover.comments(postId), { token });
    return res.data ?? [];
  },

  /** Delete one of your own comments; returns the post's new comment count. */
  async deleteComment(token: string, postId: string, commentId: string): Promise<{ commentsCount: number }> {
    return (await apiRequest<{ commentsCount: number }>(ENDPOINTS.discover.comment(postId, commentId), { method: "DELETE", token })).data;
  },

  /** Add comment to a brand post */
  async addComment(
    token: string,
    postId: string,
    content: string
  ): Promise<ApiPostComment> {
    const res = await apiRequest<ApiPostComment>(
      ENDPOINTS.discover.comments(postId),
      {
        method: "POST",
        token,
        body: { content },
      }
    );
    return res.data;
  },

  /** Fetch active brand stories */
  async listBrandStories(
    token?: string | null,
    brandId?: string
  ): Promise<ApiBrandStory[]> {
    const query = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    try {
      const res = await apiRequest<ApiBrandStory[]>(
        `${ENDPOINTS.discover.stories}${query}`,
        { token }
      );
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  /** Record view on a brand story */
  async recordStoryView(token: string, storyId: string): Promise<void> {
    try {
      await apiRequest<unknown>(ENDPOINTS.discover.storyView(storyId), {
        method: "POST",
        token,
      });
    } catch {
      // Ignore background view logging failure
    }
  },
};

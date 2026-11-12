import { apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import type { LegalSection } from "@/data/site-content";

export type CmsContentBlock = {
  id: string;
  key: string;
  type: string;
  title: string | null;
  body: unknown;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParsedLegalContent = {
  title?: string;
  intro?: string;
  sections?: LegalSection[];
  lastUpdated?: string;
};

export async function fetchCmsBlock(key: string): Promise<CmsContentBlock | null> {
  try {
    const res = await apiRequest<CmsContentBlock>(ENDPOINTS.cms.get(key));
    return res.data;
  } catch {
    return null;
  }
}

export function parseLegalBody(block: CmsContentBlock): ParsedLegalContent {
  const result: ParsedLegalContent = {};
  if (block.title) result.title = block.title;
  if (block.publishedAt || block.updatedAt) {
    const d = new Date(block.publishedAt || block.updatedAt);
    if (!isNaN(d.getTime())) {
      result.lastUpdated = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
  }

  const raw = block.body;
  if (!raw) return result;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, any>;
    if (typeof obj.intro === "string") result.intro = obj.intro;
    if (Array.isArray(obj.sections)) {
      result.sections = obj.sections.map((s: any) => ({
        heading: String(s.heading || ""),
        body: Array.isArray(s.body) ? s.body.map(String) : [String(s.body || "")],
      }));
    }
  } else if (typeof raw === "string") {
    const parts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      result.intro = parts[0];
      result.sections = parts.slice(1).map((p, idx) => ({
        heading: `Section ${idx + 1}`,
        body: [p],
      }));
    }
  }

  return result;
}

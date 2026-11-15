import { z } from "zod";

/** Form values stay strings (that's what inputs give us); they're converted when the garment is built. */
export const garmentSchema = z
  .object({
    title: z.string().trim().min(2, "Enter the garment's name"),
    sku: z.string().trim().max(60, "Keep the SKU under 60 characters"),
    price: z.string().refine((v) => Number(v) > 0, "Enter a price above 0"),
    originalPrice: z.string().refine((v) => v === "" || Number(v) > 0, "Enter a price above 0, or leave empty"),
    category: z.string().min(1, "Pick a category"),
    stock: z.string().refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Use a whole number, 0 or more"),
    colors: z.string().max(300, "Keep this under 300 characters"),
    sizes: z.string().max(300, "Keep this under 300 characters"),
    buyUrl: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^https:\/\/\S+$/i.test(v) && URL.canParse(v)), "Enter a full link starting with https://"),
    description: z.string().max(2000, "Keep the description under 2000 characters"),
    status: z.enum(["PUBLISHED", "DRAFT"]),
    featured: z.boolean(),
    collection: z.string().trim().max(80, "Keep the collection name under 80 characters"),
  })
  .refine((v) => v.originalPrice === "" || Number(v.originalPrice) > Number(v.price), { path: ["originalPrice"], message: "The original price should be higher than the price" });

export type GarmentValues = z.infer<typeof garmentSchema>;

/** "Red, Blue | Green" -> ["Red", "Blue", "Green"]. */
export const splitList = (v: string) => Array.from(new Set(v.split(/[,|]/).map((s) => s.trim()).filter(Boolean)));

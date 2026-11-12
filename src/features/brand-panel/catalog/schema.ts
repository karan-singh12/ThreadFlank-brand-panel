import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/\S+$/i.test(v) && URL.canParse(v), "Enter a full link starting with https://");

/** Form values stay strings (that's what inputs give us); they're converted when the garment is built. */
export const garmentSchema = z.object({
  title: z.string().trim().min(2, "Enter the garment's name"),
  price: z.string().refine((v) => Number(v) > 0, "Enter a price above 0"),
  category: z.string().min(1, "Pick a category"),
  stock: z.string().refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Use a whole number, 0 or more"),
  imageUrl: optionalUrl,
  buyUrl: optionalUrl,
});

export type GarmentValues = z.infer<typeof garmentSchema>;

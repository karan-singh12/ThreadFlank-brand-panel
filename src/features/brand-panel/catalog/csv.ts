/** CSV in and out for the catalog. No library: the format is small and this keeps the bundle light. */

export type ImportRow = {
  title: string;
  sku: string;
  price: string;
  originalPrice: string;
  category: string;
  collection: string;
  occasions: string;
  colors: string;
  sizes: string;
  stock: string;
  images: string;
  buyUrl: string;
  description: string;
  status: string;
};

import type { ProductItem } from "../types";

/** One catalog piece as a row of the export, in the same shape the importer reads back. */
export function productToRow(p: ProductItem): string[] {
  return [
    p.title,
    p.sku,
    String(p.price),
    p.originalPrice ? String(p.originalPrice) : "",
    p.category,
    p.collection ?? "",
    (p.occasions ?? []).join("|"),
    (p.colors ?? []).join("|"),
    (p.sizes ?? []).join("|"),
    String(p.stock),
    (p.images ?? []).join("|"),
    p.buyUrl ?? "",
    p.description ?? "",
    p.status === "PUBLISHED" ? "Live" : "Draft",
  ];
}

/** Column order of the template and the export, so an export can be edited and imported back. */
export const COLUMNS: { key: keyof ImportRow; label: string }[] = [
  { key: "title", label: "title" },
  { key: "sku", label: "sku" },
  { key: "price", label: "price" },
  { key: "originalPrice", label: "original_price" },
  { key: "category", label: "category" },
  { key: "collection", label: "collection" },
  { key: "occasions", label: "occasions" },
  { key: "colors", label: "colors" },
  { key: "sizes", label: "sizes" },
  { key: "stock", label: "stock" },
  { key: "images", label: "image_urls" },
  { key: "buyUrl", label: "buy_url" },
  { key: "description", label: "description" },
  { key: "status", label: "status" },
];

/** Other names brands commonly use for the same column (Shopify, WooCommerce, hand-made sheets). */
const ALIASES: Record<keyof ImportRow, string[]> = {
  title: ["title", "name", "productname", "producttitle", "product", "garment", "garmentname", "outfit"],
  sku: ["sku", "code", "productcode", "styleid", "style", "variantsku", "id"],
  price: ["price", "sellingprice", "saleprice", "variantprice", "offerprice"],
  originalPrice: ["originalprice", "mrp", "compareatprice", "variantcompareatprice", "regularprice", "listprice"],
  category: ["category", "type", "producttype", "productcategory"],
  collection: ["collection", "collections", "edit", "drop", "range"],
  occasions: ["occasions", "occasion"],
  colors: ["colors", "color", "colours", "colour"],
  sizes: ["sizes", "size"],
  stock: ["stock", "quantity", "qty", "inventory", "inventoryqty", "inventoryquantity", "variantinventoryqty"],
  images: ["imageurls", "imageurl", "images", "image", "imagesrc", "photo", "photos", "imagelinks", "imagelink"],
  buyUrl: ["buyurl", "buylink", "producturl", "url", "link", "shopurl", "storeurl"],
  description: ["description", "bodyhtml", "details", "about", "caption"],
  status: ["status", "visibility", "published"],
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Splits CSV text into rows of fields. Handles quotes, doubled quotes, newlines inside quotes, and , ; or tab separators. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = [",", ";", "\t"].map((c) => ({ c, n: firstLine.split(c).length })).sort((a, b) => b.n - a.n)[0].c;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export type ParsedSheet = { rows: ImportRow[]; unknownColumns: string[]; missingColumns: string[] };

/** Matches the header row to our columns by name, then maps every data row. */
export function readSheet(text: string): ParsedSheet {
  const grid = parseCsv(text);
  if (grid.length === 0) return { rows: [], unknownColumns: [], missingColumns: ["title", "sku", "price", "category"] };
  const header = grid[0].map(norm);
  const index = {} as Record<keyof ImportRow, number>;
  for (const key of Object.keys(ALIASES) as (keyof ImportRow)[]) index[key] = header.findIndex((h) => ALIASES[key].includes(h));

  const known = new Set(Object.values(ALIASES).flat());
  const unknownColumns = grid[0].filter((_, i) => !known.has(header[i]));
  const missingColumns = (["title", "sku", "price", "category"] as const).filter((k) => index[k] < 0).map((k) => COLUMNS.find((c) => c.key === k)!.label);

  const rows = grid.slice(1).map((cells) => {
    const get = (k: keyof ImportRow) => (index[k] >= 0 ? (cells[index[k]] ?? "").trim() : "");
    const row = {} as ImportRow;
    for (const c of COLUMNS) row[c.key] = get(c.key);
    // Shopify's "published" column holds TRUE/FALSE.
    if (/^(true|false)$/i.test(row.status)) row.status = row.status.toLowerCase() === "true" ? "live" : "draft";
    // Shopify body is HTML; keep the words.
    row.description = row.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return row;
  });
  return { rows, unknownColumns, missingColumns };
}

const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export const toCsv = (header: string[], rows: string[][]) => [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

export const TEMPLATE = toCsv(
  COLUMNS.map((c) => c.label),
  [
    ["Zari brocade lehenga", "LEH-001", "84000", "95000", "Ethnic Wear", "Wedding Edit 2026", "Shaadi|Reception", "Antique Gold|Blush Pink", "S|M|L", "14", "https://yourbrand.com/img/leh-001-a.jpg|https://yourbrand.com/img/leh-001-b.jpg", "https://yourbrand.com/shop/leh-001", "Hand-woven silk with a zari border.", "Live"],
    ["Linen co-ord set", "CO-014", "6200", "", "Minimalist", "Summer Linen", "Office party", "Sage", "M|L", "40", "https://yourbrand.com/img/co-014.jpg", "https://yourbrand.com/shop/co-014", "", "Draft"],
  ]
);

export function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿" + content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

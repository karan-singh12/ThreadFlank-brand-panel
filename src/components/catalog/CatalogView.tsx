"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  ShoppingBag,
  RefreshCw,
  X,
  Globe,
  Edit2,
  Check,
} from "lucide-react";
import type { ProductItem } from "@/types";
import { formatRupee, formatCompactNumber, cn } from "@/lib/utils";
import { trackBuyClick } from "@/lib/api";

interface CatalogViewProps {
  products: ProductItem[];
  onAddProduct: (prod: ProductItem) => void;
  onUpdateProduct?: (prod: ProductItem) => void;
}

export function CatalogView({ products, onAddProduct, onUpdateProduct }: CatalogViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // New product form state
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Ethnic Wear");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newBuyUrl, setNewBuyUrl] = useState("");

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;

    const created: ProductItem = {
      id: `prod_${Date.now()}`,
      title: newTitle,
      sku: `RM-${Math.floor(Math.random() * 900 + 100)}`,
      price: Number(newPrice),
      images: [
        newImageUrl ||
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
      ],
      category: newCategory,
      occasions: ["Shaadi", "Diwali"],
      colors: ["Royal Violet"],
      sizes: ["S", "M", "L"],
      stock: 10,
      isDrapeReady: true,
      drapeScore: 95,
      drapesCount: 0,
      clicksCount: 0,
      buyUrl: newBuyUrl || "https://rawmango.com",
      featured: true,
      newDrop: true,
    };

    onAddProduct(created);
    setShowAddModal(false);
    setNewTitle("");
    setNewPrice("");
    setNewImageUrl("");
    setNewBuyUrl("");
  };

  const handleSaveEditBuyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (onUpdateProduct) {
      onUpdateProduct(editingProduct);
    }
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Minimal Action Bar (No Big Header Box) ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-white tracking-tight">Catalog & Garments</span>
          <span className="text-xs text-muted px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            {products.length} Items Live
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-muted hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span className="hidden sm:inline">Shopify Sync</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="size-4" />
            <span>Add Garment</span>
          </button>
        </div>
      </div>

      {/* ─── Search & Category Filter (Clean Bar, Zero Boxed Border) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search garments, SKU, collection..."
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] pl-9 pr-3 py-2 text-xs text-white placeholder:text-muted/60 focus:border-accent-bright outline-none font-sans"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                selectedCategory === cat
                  ? "chip-on font-semibold shadow-sm"
                  : "bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.06]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product Grid (User-Panel Style Dark Luxury Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((prod) => {
          let buyDomain = "External Store";
          try {
            buyDomain = new URL(prod.buyUrl).hostname.replace(/^www\./, "");
          } catch {
            // fallback
          }

          return (
            <div
              key={prod.id}
              className="rounded-2xl bg-[#090b1e]/80 border border-white/[0.06] hover:border-white/15 overflow-hidden flex flex-col justify-between group transition-all duration-200"
            >
              {/* Garment Image */}
              <div className="relative aspect-[3/4] w-full bg-black/40 overflow-hidden">
                <Image
                  src={prod.images[0]}
                  alt={prod.title}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3" />
                    <span>Drape Ready</span>
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-white/80 font-medium">
                    {prod.sku}
                  </span>
                </div>
              </div>

              {/* Garment Details & Integrated Buy Redirect */}
              <div className="p-3.5 space-y-3">
                <div>
                  <h3 className="text-xs font-medium text-white truncate group-hover:text-accent-bright transition-colors">
                    {prod.title}
                  </h3>
                  <div className="text-xs text-muted flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold text-white">
                      {formatRupee(prod.price)}
                    </span>
                    <span className="text-[11px] text-muted">{prod.category}</span>
                  </div>
                </div>

                {/* Direct Buy Now Navigation Section */}
                <div className="p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted flex items-center gap-1">
                      <ShoppingBag className="size-3 text-accent-bright" />
                      <span>Buy Redirect</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prod)}
                      className="text-accent-bright hover:underline flex items-center gap-0.5 text-[11px] cursor-pointer"
                    >
                      <Edit2 className="size-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Clickable Test Link (Opens in New Tab) */}
                  <a
                    href={prod.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackBuyClick(prod.id)}
                    className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-xs text-white/90 hover:text-white transition-colors group/link"
                    title={`Test link in new tab: ${prod.buyUrl}`}
                  >
                    <span className="truncate max-w-[170px]">{buyDomain}</span>
                    <span className="flex items-center gap-0.5 text-accent-bright shrink-0 text-[11px] font-medium">
                      <span>Test ↗</span>
                    </span>
                  </a>

                  <div className="text-[10px] text-muted flex items-center justify-between pt-0.5">
                    <span>Referrals:</span>
                    <span className="text-emerald-400 font-medium">
                      {prod.clicksCount || 0} visits
                    </span>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted">
                  <span className="text-accent-bright font-medium">
                    {formatCompactNumber(prod.drapesCount)} Drapes
                  </span>
                  <span className="text-emerald-400 font-medium">{prod.drapeScore}% Fit</span>
                  <span>{prod.stock} in stock</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Edit Buy Link Modal ─── */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#090b1e] border border-white/10 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Edit Direct Buy Redirect</h3>
                <p className="text-xs text-muted truncate max-w-[280px]">{editingProduct.title}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBuyUrl} className="space-y-4">
              <div>
                <label className="text-xs text-white/80 font-medium flex items-center gap-1">
                  <Globe className="size-3 text-accent-bright" />
                  <span>Product Checkout URL</span>
                </label>
                <input
                  type="url"
                  value={editingProduct.buyUrl}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, buyUrl: e.target.value })
                  }
                  required
                  placeholder="https://rawmango.com/product/..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                />
                <p className="text-[11px] text-muted mt-1">
                  Users clicking Buy on this garment will navigate directly to this URL in a new tab.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs text-muted hover:text-white hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Garment Modal ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#090b1e] border border-white/10 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h3 className="text-sm font-semibold text-white">Add New Catalog Garment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="text-xs text-white/80 font-medium">Garment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Chandrakala Zari Brocade Lehenga"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/80 font-medium">Retail Price (₹)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    placeholder="84000"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/80 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                  >
                    <option value="Ethnic Wear" className="bg-[#090b1e]">Ethnic Wear</option>
                    <option value="Suits & Sets" className="bg-[#090b1e]">Suits & Sets</option>
                    <option value="Sarees" className="bg-[#090b1e]">Sarees</option>
                    <option value="Menswear" className="bg-[#090b1e]">Menswear</option>
                    <option value="Contemporary" className="bg-[#090b1e]">Contemporary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/80 font-medium">Garment Image URL</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                />
              </div>

              <div>
                <label className="text-xs text-white/80 font-medium flex items-center gap-1">
                  <Globe className="size-3 text-accent-bright" />
                  <span>Direct Website Buy Redirect URL</span>
                </label>
                <input
                  type="url"
                  value={newBuyUrl}
                  onChange={(e) => setNewBuyUrl(e.target.value)}
                  placeholder="https://rawmango.com/shop/..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-accent-bright"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-muted hover:text-white hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Publish Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

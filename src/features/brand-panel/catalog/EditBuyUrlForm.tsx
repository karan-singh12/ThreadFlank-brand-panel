"use client";

import { useState, type FormEvent } from "react";
import { ActionButton, Field, Notice } from "@/components/ui/Controls";
import { errorMessage } from "../useResource";
import type { ProductItem } from "../types";

export function EditBuyUrlForm({ product, onSave, onDone }: { product: ProductItem; onSave: (id: string, url: string) => Promise<void>; onDone: () => void }) {
  const [url, setUrl] = useState(product.buyUrl);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { protocol } = new URL(url.trim());
      if (protocol !== "http:" && protocol !== "https:") throw new Error();
    } catch {
      setError("Enter a full link starting with https://");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(product.id, url.trim());
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="-mt-2 truncate text-sm text-muted">{product.title}</p>
      {error && <Notice tone="error">{error}</Notice>}
      <Field
        label="Product page link"
        type="url"
        autoFocus
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setError("");
        }}
        hint="Shoppers who tap Buy open this page in a new tab."
      />
      <div className="flex justify-end gap-2 pt-2">
        <ActionButton variant="ghost" onClick={onDone}>
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={saving}>
          Save link
        </ActionButton>
      </div>
    </form>
  );
}

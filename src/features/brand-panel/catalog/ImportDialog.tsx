"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, TriangleAlert } from "lucide-react";
import { ActionButton, Notice } from "@/components/ui/Controls";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthProvider";
import { brandApi } from "../api";
import type { ImportResult } from "../types";
import { errorMessage } from "../useResource";
import { download, readSheet, TEMPLATE, toCsv, type ParsedSheet } from "./csv";

const CHUNK = 250;
const MAX_ROWS = 2000;
const MAX_BYTES = 5 * 1024 * 1024;

type Totals = Omit<ImportResult, "received" | "errors"> & { errors: { line: number; sku?: string; message: string }[]; sent: number };
const EMPTY: Totals = { created: 0, updated: 0, skipped: 0, failed: 0, errors: [], sent: 0 };

/** Bulk import: pick a CSV, check it, send it 250 rows at a time, and report every row that could not be added. */
export function ImportDialog({ open, onClose, categories, occasions, onFinished }: { open: boolean; onClose: () => void; categories: readonly string[]; occasions: readonly string[]; onFinished: () => void }) {
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [phase, setPhase] = useState<"pick" | "running" | "done">("pick");
  const [totals, setTotals] = useState<Totals>(EMPTY);
  const [error, setError] = useState("");

  const reset = () => {
    setFileName("");
    setSheet(null);
    setPhase("pick");
    setTotals(EMPTY);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };
  const close = () => {
    if (phase === "running") return;
    if (phase === "done") onFinished();
    reset();
    onClose();
  };

  const onFile = async (file: File | undefined) => {
    setError("");
    setSheet(null);
    if (!file) return;
    if (file.size > MAX_BYTES) return setError("That file is over 5 MB. Split it into smaller files.");
    const parsed = readSheet(await file.text());
    if (parsed.rows.length > MAX_ROWS) return setError(`That file has ${parsed.rows.length} rows. Import up to ${MAX_ROWS} at a time.`);
    setFileName(file.name);
    setSheet(parsed);
  };

  const start = async () => {
    if (!token || !sheet || sheet.rows.length === 0) return;
    setPhase("running");
    setError("");
    const acc: Totals = { ...EMPTY, errors: [] };
    try {
      for (let at = 0; at < sheet.rows.length; at += CHUNK) {
        const part = sheet.rows.slice(at, at + CHUNK);
        const res = await brandApi.importRows(token, part, updateExisting);
        acc.created += res.created;
        acc.updated += res.updated;
        acc.skipped += res.skipped;
        acc.failed += res.failed;
        acc.sent += part.length;
        // Row 1 of the sheet is line 2 of the file, because line 1 is the header.
        for (const e of res.errors) acc.errors.push({ line: at + e.row + 1, sku: e.sku, message: e.message });
        setTotals({ ...acc, errors: [...acc.errors] });
      }
    } catch (e) {
      setError(`Stopped after ${acc.sent} of ${sheet.rows.length} rows: ${errorMessage(e)} Rows before that were saved.`);
    }
    setTotals({ ...acc, errors: [...acc.errors] });
    setPhase("done");
  };

  const rows = sheet?.rows.length ?? 0;
  const blocked = !sheet || rows === 0 || sheet.missingColumns.length > 0;

  return (
    <Modal open={open} onClose={close} title="Import garments from CSV" className="max-w-2xl">
      {phase === "pick" && (
        <div className="space-y-5">
          <p className="text-sm text-muted">
            Add hundreds of garments at once. Download the template, fill one row per garment, then upload it. Image links must be https, and several can be separated with <span className="text-white">|</span>.
          </p>
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="ghost" onClick={() => download("threadflank-catalog-template.csv", TEMPLATE)}>
              <Download className="size-4" aria-hidden /> Download template
            </ActionButton>
            <ActionButton onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="size-4" aria-hidden /> Choose CSV file
            </ActionButton>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          {sheet && (
            <div className="space-y-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <p className="text-sm text-white">
                <span className="font-medium">{fileName}</span> · {rows.toLocaleString("en-IN")} {rows === 1 ? "row" : "rows"} found
              </p>
              {sheet.missingColumns.length > 0 && <Notice tone="error">Missing required column{sheet.missingColumns.length > 1 ? "s" : ""}: {sheet.missingColumns.join(", ")}. Check the first row of your file.</Notice>}
              {sheet.unknownColumns.length > 0 && <p className="text-xs text-muted">Ignored columns: {sheet.unknownColumns.join(", ")}</p>}
              {rows > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead className="text-muted">
                      <tr>
                        <th className="py-1.5 pr-3 font-medium">Title</th>
                        <th className="py-1.5 pr-3 font-medium">SKU</th>
                        <th className="py-1.5 pr-3 font-medium">Price</th>
                        <th className="py-1.5 pr-3 font-medium">Category</th>
                        <th className="py-1.5 font-medium">Collection</th>
                      </tr>
                    </thead>
                    <tbody className="text-subtle">
                      {sheet.rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-t border-white/8">
                          <td className="max-w-[180px] truncate py-1.5 pr-3 text-white">{r.title}</td>
                          <td className="py-1.5 pr-3">{r.sku}</td>
                          <td className="py-1.5 pr-3">{r.price}</td>
                          <td className="py-1.5 pr-3">{r.category}</td>
                          <td className="py-1.5">{r.collection}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows > 5 && <p className="pt-2 text-xs text-muted">…and {(rows - 5).toLocaleString("en-IN")} more</p>}
                </div>
              )}
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-subtle">
                <input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} className="mt-0.5 size-4 accent-[#6645eb]" />
                <span>
                  Update garments whose SKU already exists
                  <span className="block text-xs text-muted">Off: existing SKUs are skipped. On: price, stock, images and the rest are replaced by the file.</span>
                </span>
              </label>
            </div>
          )}

          <details className="text-xs text-muted">
            <summary className="cursor-pointer text-subtle">Allowed categories and occasions</summary>
            <p className="mt-2">
              <span className="text-white">Categories:</span> {categories.join(", ")}
            </p>
            <p className="mt-1">
              <span className="text-white">Occasions:</span> {occasions.join(", ")}
            </p>
          </details>

          <div className="flex justify-end gap-2">
            <ActionButton variant="ghost" onClick={close}>
              Cancel
            </ActionButton>
            <ActionButton disabled={blocked} onClick={() => void start()}>
              Import {rows > 0 ? rows.toLocaleString("en-IN") : ""} {rows === 1 ? "garment" : "garments"}
            </ActionButton>
          </div>
        </div>
      )}

      {phase === "running" && (
        <div className="space-y-4 py-4" role="status" aria-live="polite">
          <p className="text-sm text-white">
            Importing… {totals.sent.toLocaleString("en-IN")} of {rows.toLocaleString("en-IN")} rows
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${rows ? (totals.sent / rows) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-muted">Keep this window open until it finishes.</p>
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Added", totals.created],
              ["Updated", totals.updated],
              ["Skipped", totals.skipped],
              ["Failed", totals.failed],
            ].map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <p className="text-xl font-medium tabular-nums text-white">{Number(n).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
          {totals.skipped > 0 && <p className="text-xs text-muted">Skipped garments already exist with the same SKU. Turn on “Update garments whose SKU already exists” to change them from a file.</p>}
          {totals.failed === 0 && !error ? (
            <p className="flex items-center gap-2 text-sm text-green">
              <CheckCircle2 className="size-4" aria-hidden /> Every row was processed.
            </p>
          ) : (
            totals.errors.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-[#f6c453]">
                  <TriangleAlert className="size-4" aria-hidden /> {totals.failed} {totals.failed === 1 ? "row needs" : "rows need"} fixing
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-white/[0.03] p-3 text-xs text-subtle ring-1 ring-white/10">
                  {totals.errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                      <span className="text-white">Line {e.line}</span>
                      {e.sku ? ` (${e.sku})` : ""}: {e.message}
                    </li>
                  ))}
                  {totals.errors.length > 50 && <li className="text-muted">…and {totals.errors.length - 50} more in the report.</li>}
                </ul>
                <ActionButton variant="ghost" className="h-9" onClick={() => download("import-errors.csv", toCsv(["line", "sku", "problem"], totals.errors.map((e) => [String(e.line), e.sku ?? "", e.message])))}>
                  <Download className="size-4" aria-hidden /> Download error report
                </ActionButton>
              </div>
            )
          )}
          <div className="flex justify-end gap-2">
            <ActionButton variant="ghost" onClick={reset}>
              Import another file
            </ActionButton>
            <ActionButton onClick={close}>Done</ActionButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

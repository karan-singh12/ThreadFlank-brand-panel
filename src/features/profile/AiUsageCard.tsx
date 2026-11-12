"use client";

import { useEffect, useState } from "react";
import { Activity, LoaderCircle } from "lucide-react";
import { BarChart, CHART_COLORS } from "@/components/ui/BarChart";
import { useAuth } from "@/features/auth/AuthProvider";
import { socialApi, type AiUsageSummary } from "@/features/social/api";

const TASK_LABELS: Record<string, string> = {
  "try-on": "Try-ons",
  twin: "Twin builds",
  pose: "Poses",
  makeup: "Makeup",
  liveness: "Videos",
  "text-to-look": "Described looks",
  "agentic-reasoning": "Occasion planner",
  "wardrobe-combos": "Wardrobe combos",
  "caption-generation": "Captions",
  "rag-answer": "Answers",
};

/** Your own AI usage over the last 30 days (per-user LLM observability). */
export function AiUsageCard() {
  const { token } = useAuth();
  const [data, setData] = useState<AiUsageSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    socialApi
      .myAiUsage(token)
      .then(setData)
      .catch(() => setError(true));
  }, [token]);

  return (
    <section className="card-violet flex max-w-[620px] flex-col gap-4 rounded-(--radius-panel) p-6">
      <h2 className="flex items-center gap-2 text-title font-medium text-white">
        <Activity className="size-5 text-accent-bright" />
        Your AI usage
      </h2>
      {error ? (
        <p className="text-sm text-muted">Usage isn&apos;t available right now.</p>
      ) : !data ? (
        <LoaderCircle className="size-5 animate-spin text-accent-bright" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Requests (30 days)" value={data.totals.requests.toLocaleString()} />
            <Stat label="Success rate" value={data.totals.successRate == null ? "—" : `${data.totals.successRate}%`} />
            <Stat label="All time" value={data.allTime.requests.toLocaleString()} />
          </div>
          {data.totals.requests > 0 && (
            <BarChart
              title="Requests per day"
              rows={data.daily.map((d) => ({ label: d.date.slice(5), values: { ok: d.requests - d.failed, failed: d.failed } }))}
              series={[
                { key: "ok", label: "Succeeded", color: CHART_COLORS.series1 },
                { key: "failed", label: "Failed", color: CHART_COLORS.critical },
              ]}
            />
          )}
          {data.byTask.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {data.byTask.map((t) => (
                <li key={t.taskType} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-subtle">
                  {TASK_LABELS[t.taskType] ?? t.taskType} · <span className="text-white">{t.requests}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-title font-medium text-white">{value}</p>
    </div>
  );
}

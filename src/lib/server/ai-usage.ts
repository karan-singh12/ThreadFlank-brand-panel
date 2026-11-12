import { API_BASE_URL, ENDPOINTS } from "@/lib/api/config";

export type EngineAttempt = { provider: string; model: string; latencyMs: number; error: string };
export type ImageResult = {
  url: string;
  engine: string;
  provider: string;
  model: string;
  failedAttempts: EngineAttempt[];
};

export class ImageEngineError extends Error {
  constructor(
    message: string,
    readonly reason: string = "failed",
    readonly status: number = 500,
    readonly attempts: EngineAttempt[] = []
  ) {
    super(message);
  }
}

type UsageEntry = {
  /** Model to log when the work returns a bare URL (single-engine calls such as video). */
  model: string;
  taskType: string;
  metadata?: Record<string, unknown>;
};

/**
 * Reports one AI run (try-on, twin, pose, video…) to the backend's
 * LLM-observability log, attributed to whoever sent the Authorization header.
 * Best-effort: never throws and never delays the response by more than 4s.
 */
async function report(req: Request, body: Record<string, unknown>) {
  const auth = req.headers.get("authorization");
  if (!auth) return;
  try {
    await fetch(`${API_BASE_URL}${ENDPOINTS.aiUsage.report}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Observability must never break the feature.
  }
}

/** Inline (data:) results are megabytes of base64; only hosted URLs are worth logging. */
const loggableUrl = (url: string) => (url.startsWith("data:") ? undefined : url);

function reportAttempts(req: Request, entry: UsageEntry, attempts: EngineAttempt[]) {
  return Promise.all(
    attempts.map((a) =>
      report(req, { ...entry, provider: a.provider, model: a.model, latencyMs: a.latencyMs, success: false, errorMessage: a.error })
    )
  );
}

/**
 * Runs `work`, then logs its latency, outcome and output URL. Image-engine
 * results also log every engine that failed before the one that succeeded.
 * Re-throws failures.
 */
export async function trackAiRun<T extends string | ImageResult>(req: Request, entry: UsageEntry, work: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    const output = await work();
    if (typeof output === "string") {
      await report(req, { ...entry, latencyMs: Date.now() - started, success: true, outputUrl: loggableUrl(output) });
    } else {
      await reportAttempts(req, entry, output.failedAttempts);
      const failedMs = output.failedAttempts.reduce((sum, a) => sum + a.latencyMs, 0);
      await report(req, {
        ...entry,
        provider: output.provider,
        model: output.model,
        latencyMs: Date.now() - started - failedMs,
        success: true,
        outputUrl: loggableUrl(output.url),
      });
    }
    return output;
  } catch (error) {
    if (error instanceof ImageEngineError && error.attempts.length) {
      await reportAttempts(req, entry, error.attempts);
    } else {
      await report(req, {
        ...entry,
        latencyMs: Date.now() - started,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

/** Widget try-ons are metered against the brand's widget key instead of a user. */
export async function reportWidgetSession(input: {
  key: string;
  origin?: string;
  productUrl?: string;
  success: boolean;
  model: string;
  latencyMs: number;
  errorMessage?: string;
  outputUrl?: string;
}) {
  try {
    await fetch(`${API_BASE_URL}${ENDPOINTS.widget.session}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, outputUrl: input.outputUrl ? loggableUrl(input.outputUrl) : undefined }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Metering is best-effort.
  }
}

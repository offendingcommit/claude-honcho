import { Honcho } from "@honcho-ai/sdk";
import type { HonchoCLAUDEConfig } from "./config.js";
import { getHonchoBaseUrl, getHonchoClientOptions } from "./config.js";

export interface ServerCheckResult {
  ok: boolean;
  url: string;
  serverVersion?: string;
  apiTitle?: string;
  httpStatus?: number;
  error?: string;
  durationMs: number;
}

export type AuthFailureReason = "no-key" | "unauthorized" | "network" | "unknown";

export interface AuthCheckResult {
  ok: boolean;
  reason?: AuthFailureReason;
  message?: string;
  durationMs: number;
}

export interface SummaryResult {
  ok: boolean;
  conclusionsCount?: number;
  queue?: {
    total: number;
    completed: number;
    inProgress: number;
    sessions: number;
  };
  error?: string;
  durationMs: number;
}

/**
 * Resolve the server-probe URL. We hit `/openapi.json` (FastAPI default,
 * unauthenticated) instead of `/health` because real-world Honcho deployments
 * (3.0.5+) don't expose `/health` on the API server. `getHonchoBaseUrl`
 * returns `<host>/v3`; the OpenAPI doc lives at the host root, so we strip
 * `/v3` before appending.
 */
export function getServerProbeUrl(config: HonchoCLAUDEConfig): string {
  const baseUrl = getHonchoBaseUrl(config);
  const root = baseUrl.replace(/\/v3\/?$/, "");
  return `${root}/openapi.json`;
}

/**
 * Liveness probe. Hits `/openapi.json` to confirm the server process is up
 * and serving responses. Bonus: parses the `info.version` field so callers
 * can show the running Honcho version.
 */
export async function checkHonchoServer(
  config: HonchoCLAUDEConfig,
  timeoutMs = 3000,
): Promise<ServerCheckResult> {
  const url = getServerProbeUrl(config);
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const durationMs = Date.now() - start;

    if (!res.ok) {
      return { ok: false, url, httpStatus: res.status, durationMs };
    }
    const body = (await res.json().catch(() => null)) as
      | { openapi?: string; info?: { version?: string; title?: string } }
      | null;
    return {
      ok: typeof body?.openapi === "string" && body.openapi.startsWith("3."),
      url,
      serverVersion: body?.info?.version,
      apiTitle: body?.info?.title,
      httpStatus: res.status,
      durationMs,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      url,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

/**
 * Auth probe. Calls an authenticated SDK endpoint (`queueStatus`) to verify
 * the API key works against the configured workspace. Lightweight and
 * side-effect free.
 */
export async function checkHonchoAuth(
  config: HonchoCLAUDEConfig,
): Promise<AuthCheckResult> {
  if (!config.apiKey) {
    return { ok: false, reason: "no-key", durationMs: 0 };
  }

  const start = Date.now();
  try {
    const honcho = new Honcho(getHonchoClientOptions(config));
    await honcho.queueStatus();
    return { ok: true, durationMs: Date.now() - start };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    let reason: AuthFailureReason = "unknown";
    if (message.includes("401") || lower.includes("unauthor")) {
      reason = "unauthorized";
    } else if (
      message.includes("ECONNREFUSED") ||
      message.includes("fetch failed") ||
      message.includes("ENOTFOUND") ||
      message.includes("ETIMEDOUT")
    ) {
      reason = "network";
    }
    return { ok: false, reason, message, durationMs: Date.now() - start };
  }
}

/**
 * Post-auth summary. Calls `queueStatus` + `peer.conclusions.list` in parallel
 * to gather the "warm fuzzies": queue activity, conclusion count. Failures on
 * either branch are tolerated -- the partial result is still useful.
 */
export async function gatherSummary(
  config: HonchoCLAUDEConfig,
): Promise<SummaryResult> {
  const start = Date.now();
  try {
    const honcho = new Honcho(getHonchoClientOptions(config));
    const [queueResult, conclusionsResult] = await Promise.allSettled([
      honcho.queueStatus(),
      honcho.peer(config.peerName).then((peer) => peer.conclusions.list()),
    ]);

    const result: SummaryResult = { ok: true, durationMs: Date.now() - start };

    if (queueResult.status === "fulfilled") {
      const q = queueResult.value;
      result.queue = {
        total: q.totalWorkUnits ?? 0,
        completed: q.completedWorkUnits ?? 0,
        inProgress: q.inProgressWorkUnits ?? 0,
        sessions: q.sessions ? Object.keys(q.sessions).length : 0,
      };
    }

    if (conclusionsResult.status === "fulfilled") {
      const page = conclusionsResult.value;
      result.conclusionsCount = page.total ?? page.items?.length;
    }

    return result;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}

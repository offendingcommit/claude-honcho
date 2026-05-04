import type { HonchoCLAUDEConfig } from "./config.js";
import { getHonchoBaseUrl } from "./config.js";

export interface WorkspacesResult {
  ok: boolean;
  workspaces: string[];
  total?: number;
  error?: string;
}

export interface PeersResult {
  ok: boolean;
  peers: string[];
  total?: number;
  error?: string;
}

interface ListResponse {
  items?: Array<{ id?: string; name?: string }>;
  total?: number;
}

/**
 * List workspaces accessible to the configured API key. Uses a direct fetch
 * against `POST /v3/workspaces/list` rather than the SDK to avoid the SDK's
 * side-effecting "get-or-create" workspace memoization on construction --
 * we don't want to materialize a workspace just because we asked for the list.
 */
export async function listWorkspaces(
  config: HonchoCLAUDEConfig,
  timeoutMs = 5000,
): Promise<WorkspacesResult> {
  const url = `${getHonchoBaseUrl(config)}/workspaces/list`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({}),
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, workspaces: [], error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as ListResponse;
    const workspaces = (data.items ?? [])
      .map((w) => w.id ?? w.name)
      .filter((w): w is string => typeof w === "string" && w.length > 0);

    return { ok: true, workspaces, total: data.total };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      workspaces: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * List peers visible inside a specific workspace. Same direct-fetch rationale
 * as listWorkspaces -- avoids the SDK's get-or-create side effect.
 */
export async function listPeers(
  config: HonchoCLAUDEConfig,
  workspaceId: string,
  timeoutMs = 5000,
): Promise<PeersResult> {
  const url = `${getHonchoBaseUrl(config)}/workspaces/${encodeURIComponent(workspaceId)}/peers/list`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({}),
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, peers: [], error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as ListResponse;
    const peers = (data.items ?? [])
      .map((p) => p.id ?? p.name)
      .filter((p): p is string => typeof p === "string" && p.length > 0);

    return { ok: true, peers, total: data.total };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      peers: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Optional TLS bypass for local Next.js dev behind corporate VPN/proxy.
 * Uses dynamic undici import only when enabled — never on Cloudflare Workers.
 */

type UndiciDispatcher = import("undici").Dispatcher;

let insecureDispatcher: UndiciDispatcher | null | undefined;

export function useTlsInsecureBypass(envKey: "NSE_TLS_INSECURE" | "D1_TLS_INSECURE"): boolean {
  if (process.env[envKey] !== "1") return false;
  // Never during production build or deployed Worker — local `next dev` only
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.NEXT_RUNTIME === "edge") return false;
  return true;
}

async function getInsecureDispatcher(): Promise<UndiciDispatcher | null> {
  if (insecureDispatcher !== undefined) return insecureDispatcher;

  try {
    const { Agent } = await import("undici");
    insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });
  } catch {
    insecureDispatcher = null;
  }

  return insecureDispatcher;
}

export async function fetchWithOptionalTlsBypass(
  url: string,
  init: RequestInit = {},
  envKey: "NSE_TLS_INSECURE" | "D1_TLS_INSECURE"
): Promise<Response> {
  if (!useTlsInsecureBypass(envKey)) {
    return fetch(url, init);
  }

  const dispatcher = await getInsecureDispatcher();
  if (!dispatcher) {
    return fetch(url, init);
  }

  return fetch(url, {
    ...init,
    // undici extension supported by Node fetch
    dispatcher,
  } as RequestInit & { dispatcher: UndiciDispatcher });
}

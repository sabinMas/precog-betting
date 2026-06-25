import { KALSHI_BASE_URL, hasKalshiCredentials } from "./config";
import { buildAuthHeaders } from "./auth";
import type {
  KalshiBalance,
  KalshiPosition,
  KalshiOrder,
  KalshiFill,
} from "./types";

function requireCredentials() {
  if (!hasKalshiCredentials()) {
    throw new Error(
      "Kalshi credentials not configured. Set KALSHI_API_KEY_ID and KALSHI_PRIVATE_KEY."
    );
  }
}

async function kalshiAuthFetch<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  requireCredentials();
  const headers = buildAuthHeaders(method, path);
  const url = `${KALSHI_BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Kalshi Auth API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<T>;
}

export async function getBalance(): Promise<KalshiBalance> {
  return kalshiAuthFetch<KalshiBalance>("GET", "/portfolio/balance");
}

export async function getPositions(): Promise<{ market_positions: KalshiPosition[] }> {
  return kalshiAuthFetch<{ market_positions: KalshiPosition[] }>(
    "GET",
    "/portfolio/positions"
  );
}

export async function getOrders(status?: string): Promise<{ orders: KalshiOrder[] }> {
  const qs = status ? `?status=${status}` : "";
  return kalshiAuthFetch<{ orders: KalshiOrder[] }>(
    "GET",
    `/portfolio/orders${qs}`
  );
}

export async function getFills(): Promise<{ fills: KalshiFill[] }> {
  return kalshiAuthFetch<{ fills: KalshiFill[] }>("GET", "/portfolio/fills");
}

export interface CreateOrderInput {
  ticker: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  count: number;
  type: "market" | "limit";
  yes_price?: number; // cents 1-99
  no_price?: number;
  client_order_id?: string;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ order: KalshiOrder }> {
  if (process.env.ENABLE_TRADING !== "true") {
    throw new Error(
      "Trading is disabled. Set ENABLE_TRADING=true to enable order submission."
    );
  }
  return kalshiAuthFetch<{ order: KalshiOrder }>("POST", "/portfolio/orders", input);
}

export async function cancelOrder(
  orderId: string
): Promise<{ order: KalshiOrder }> {
  return kalshiAuthFetch<{ order: KalshiOrder }>(
    "DELETE",
    `/portfolio/orders/${orderId}`
  );
}

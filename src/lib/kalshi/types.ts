// ─── Kalshi API Types ────────────────────────────────────────────────────────

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  open_time: string;
  close_time: string;
  expected_expiration_time?: string;
  expiration_time?: string;
  status: "open" | "closed" | "settled";
  result?: "yes" | "no" | "";
  yes_bid: number;   // cents 0-100
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price?: number;
  previous_yes_bid?: number;
  previous_yes_ask?: number;
  previous_price?: number;
  volume: number;
  volume_24h?: number;
  liquidity: number;
  open_interest?: number;
  rules_primary?: string;
  rules_secondary?: string;
  can_close_early: boolean;
  expiration_value?: string;
  category?: string;
  risk_limit_cents?: number;
  strike_type?: string;
  floor_strike?: number;
  cap_strike?: number;
  response_price_units?: string;
  notional_value?: number;
  tick_size?: number;
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  sub_title?: string;
  title: string;
  mutually_exclusive: boolean;
  category?: string;
  markets: KalshiMarket[];
}

export interface KalshiSeries {
  ticker: string;
  title: string;
  category?: string;
  tags?: string[];
}

export interface KalshiOrderbookLevel {
  price: number; // cents
  delta: number; // quantity
}

export interface KalshiOrderbook {
  yes: KalshiOrderbookLevel[];
  no: KalshiOrderbookLevel[];
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

export interface KalshiEventResponse {
  event: KalshiEvent;
}

export interface KalshiOrderbookResponse {
  orderbook: KalshiOrderbook;
}

// ─── Normalized/Enriched Types (UI layer) ────────────────────────────────────

export interface NormalizedMarket extends KalshiMarket {
  impliedProbability: number;      // 0-1, derived from yes_ask midpoint
  spread: number;                  // yes_ask - yes_bid
  spreadScore: number;             // 0-100, lower spread = higher score
  liquidityScore: number;          // 0-100
  volumeScore: number;             // 0-100
  momentumScore: number;           // 0-100, price change signal
  compositeScore: number;          // weighted composite
  expiresInMs: number;             // ms until expiry
  expiresInLabel: string;          // "2h", "3d", etc.
  surfacedReasons: string[];       // ["high volume", "tight spread", ...]
  isExpiringSoon: boolean;
  isHighVolume: boolean;
  isFastMover: boolean;
  isWideSpread: boolean;
}

export interface NormalizedOrderbook {
  yesLevels: { price: number; quantity: number; cumulative: number }[];
  noLevels: { price: number; quantity: number; cumulative: number }[];
  bestYesBid: number;
  bestYesAsk: number;
  midpoint: number;
  spread: number;
}

// ─── Account Types ───────────────────────────────────────────────────────────

export interface KalshiBalance {
  balance: number;         // cents
  payout: number;
  fees_paid?: number;
}

export interface KalshiPosition {
  ticker: string;
  event_ticker: string;
  market_title?: string;
  position: number;       // positive = yes, negative = no
  total_traded: number;
  fees_paid: number;
  realized_pnl: number;
  resting_orders_count: number;
}

export interface KalshiOrder {
  order_id: string;
  ticker: string;
  event_ticker?: string;
  client_order_id?: string;
  type: "market" | "limit";
  action: "buy" | "sell";
  side: "yes" | "no";
  status: "resting" | "canceled" | "executed" | "pending";
  yes_price?: number;
  no_price?: number;
  count: number;
  remaining_count?: number;
  queue_position?: number;
  created_time: string;
  taker_fees?: number;
}

export interface KalshiFill {
  trade_id: string;
  order_id: string;
  ticker: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  count: number;
  yes_price: number;
  no_price: number;
  created_time: string;
  is_taker?: boolean;
}

// ─── Combo Lab Types ─────────────────────────────────────────────────────────

export interface ComboLeg {
  ticker: string;
  title: string;
  side: "yes" | "no";
  impliedProbability: number;
  userProbability?: number;
  price: number; // cents
}

export interface ComboAnalysis {
  legs: ComboLeg[];
  combinedImpliedProbability: number;   // product of implied probs
  combinedUserProbability?: number;      // product of user probs
  combinedPayout: number;               // cents per $1 risked
  expectedValueCents?: number;          // EV if user probs provided
  correlationRiskFlag: boolean;
  correlationWarnings: string[];
  independenceWarning: string;
}

// ─── Assistant Types ─────────────────────────────────────────────────────────

export interface AssistantQuery {
  threadId?: string;
  message: string;
}

export interface AssistantResponse {
  threadId: string;
  response: string;
  sources?: string[];
}

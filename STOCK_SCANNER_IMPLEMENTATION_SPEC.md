# Stock Scanner Implementation Spec

## 1. Product Vision
Build a stock market scanner focused on Indian equities, powered by NSE market data, technical analysis, score-based alerts, and AI-generated explanations. The product should detect high-probability bullish and bearish setups while filtering false breakouts, ranking opportunities by confidence, and helping users act with better context.

Core mission:
- find high-quality setups
- reduce false signals
- explain why a setup is valid
- provide actionable scoring and probability
- support intraday and swing-timeframe strategies

## Signal safety and current feed coverage

The current NSE integration supplies index snapshots from `/api/allIndices`, top movers, OI-spurt snapshots, corporate actions, and an event calendar. Fetch requests bypass caches, each feed is handled independently, and an unavailable feed must not hide successful market snapshots. Show the time the app fetched data separately from the exchange quote timestamp; do not claim tick-level real-time data when NSE does not include a source timestamp. The integration does not supply the intraday candles, indicator values, relative-volume baseline, verified news sentiment, major-event risk status, or full option-chain data required by the requested trading rules. Do not infer those values from daily price changes, absolute share volume, or an OI-spurt snapshot.

The scanner also supports an explicitly unofficial Yahoo Finance chart fallback through `/api/market/intraday`, requesting 5-minute candles and refreshing approximately once per minute during NSE market hours. Yahoo data is not a licensed or guaranteed real-time feed and can be delayed, throttled, or unavailable. The scanner labels its source and candle timestamp, rejects candles older than 15 minutes for active technical setups, and never equates a technical candidate with a verified BUY/SELL signal. Calculated indicators include EMA 9/20/50/200, session VWAP, Supertrend, RSI, MACD direction, ADX, Stochastic RSI, and comparable-time relative volume. NIFTY 50 index candles report zero volume, so VWAP and volume confirmation are unavailable for the index; do not substitute ETF volume.

The intraday signal engine must fail closed: emit BUY or SELL only when all six direction-specific rules pass, ADX is at least 20, volume is above its average, the market is not sideways, no major event risk is present, and the quote is no more than five minutes old during market hours. Missing, stale, or blocked inputs produce HOLD. The displayed rule-match score measures satisfied rules only; it is not a win probability or an accuracy guarantee.

NIFTY 50 may show a separate informational snapshot bias when its NSE snapshot aligns above/below the open and previous close and in the upper/lower portion of the session range. This limited bias is not a BUY/SELL trade signal and must be labeled as a last-session snapshot when the market is closed. Stock rows without the required intraday feed should say they cannot be scored rather than repeating HOLD as if an evaluated setup were available.

---

## 2. Target Users
- Retail traders seeking breakout setup alerts
- Swing traders looking for trend continuation opportunities
- Intraday traders tracking ORB and momentum setups
- Users who want explanations instead of raw chart noise
- Investors who want watchlist-based stock intelligence

---

## 3. MVP Scope

### In-Scope for MVP
- Resistance breakout detection
- Support breakdown detection
- Volume breakout detection
- Gap-up and gap-down detection
- ORB scanner
- Near breakout watchlist
- Failed breakout detection
- RSI, VWAP, EMA20, EMA50, EMA200, MACD, ATR, Bollinger Bands
- Alert engine with confidence score
- Bullish / bearish / high-conviction trigger generation
- AI explanation output per alert
- False breakout filter logic
- Dashboard summary cards
- Market leaders and unusual volume widgets

### Out-of-Scope for MVP
- Full AI model-powered trading advisor
- Advanced portfolio optimization
- Deep social sentiment engine
- Full broker integration
- Historical backtesting engine
- Institutional-grade data feed integration

---

## 4. System Architecture

### High-Level Components
1. Data ingestion layer
   - NSE market data provider
   - Daily OHLCV data
   - Intraday candle data
   - Sector and index data
   - News and event data

2. Signal generation layer
   - Breakout detector
   - Breakdown detector
   - ORB engine
   - Momentum engine
   - Trend engine
   - Score engine

3. Alerting layer
   - Rule engine
   - Confidence calculation
   - Alert deduplication
   - Notification dispatch

4. Explanation layer
   - Structured signal explanation
   - Indicator summary
   - Risk summary
   - Score narrative

5. Dashboard layer
   - Scanner panels
   - Watchlists
   - Leaderboards
   - News and market color
   - Chart preview widgets

6. Storage layer
   - PostgreSQL / D1 / Cloudflare-style DB option
   - Time-series candle data
   - Signal history
   - User alerts and watchlists

---

## 5. Data Model

### Symbol Master
```ts
interface SymbolMeta {
  symbol: string;
  companyName: string;
  exchange: 'NSE';
  sector: string;
  industry: string;
  marketCap?: number;
  isFNO?: boolean;
  liquidityScore?: number;
  active?: boolean;
}
```

### Candle Data
```ts
interface Candle {
  symbol: string;
  timeframe: '5m' | '15m' | '30m' | '1h' | '1d' | '1w';
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Support/Resistance Zone
```ts
interface SupportResistanceZone {
  symbol: string;
  timeframe: string;
  level: number;
  type: 'support' | 'resistance';
  strength: number;
  createdAt: string;
}
```

### Signal Record
```ts
interface SignalRecord {
  id: string;
  symbol: string;
  signalType: 'breakout' | 'breakdown' | 'orb' | 'momentum' | 'failed_breakout' | 'retest';
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  breakoutScore: number;
  trendScore: number;
  momentumScore: number;
  riskScore: number;
  bullishProbability: number;
  bearishProbability: number;
  neutralProbability: number;
  confirmedAt: string;
  status: 'active' | 'expired' | 'triggered';
}
```

### Alert Record
```ts
interface AlertRecord {
  id: string;
  symbol: string;
  alertType: 'bullish' | 'bearish' | 'high_conviction' | 'reversal' | 'volume_spike' | 'watchlist';
  title: string;
  message: string;
  triggerReason: string;
  confirmedIndicators: string[];
  riskFactors: string[];
  bullishFactors: string[];
  bearishFactors: string[];
  confidence: number;
  createdAt: string;
  isRead: boolean;
}
```

---

## 6. Signal Detection Logic

### 6.1 Resistance Breakout Detection
Requirements:
- Price closes above last resistance zone
- Breakout is above the zone with some buffer
- Volume is above average threshold
- Trend aligns with breakout direction
- Price should not be too extended beyond ATR

Pseudo logic:
```ts
const isResistanceBreakout = (
  close,
  resistance,
  avgVolume,
  volume,
  atr,
  ema20,
  ema50,
  trendDirection
) => {
  const aboveResistance = close > resistance * 1.002;
  const volumeConfirmed = volume > avgVolume * 1.5;
  const trendAligned = ema20 > ema50;
  const volatilityOkay = atr > 0;

  return aboveResistance && volumeConfirmed && trendAligned && volatilityOkay;
};
```

### 6.2 Support Breakdown Detection
Requirements:
- Price closes below support
- Volume expands
- EMA alignment weakens
- RSI or MACD confirms bearish momentum

### 6.3 Consolidation Breakout Detection
Requirements:
- Range compression over 10-30 candles
- Narrow high-low band
- Breakout in either direction
- Follow-through with volume
- Score as high-quality only if close remains beyond range

### 6.4 Volume Breakout Detection
Requirements:
- volume > 1.5x to 2.5x average volume
- price closes in direction of move
- breakout beyond key range or moving average
- strong if volume and price both expand together

### 6.5 Gap-Up / Gap-Down Detection
Requirements:
- opening gap above/below previous close
- check opening price vs prior close
- measure follow-through in first 15-30 minutes
- risk if gap closes back immediately

### 6.6 ORB Detection
Requirements:
- define opening range from first 15/30 minutes
- bullish if price above OR high with volume and momentum
- bearish if price below OR low
- filter out weak range build-ups

### 6.7 Breakout Retest Detection
Requirements:
- breakout occurs
- price returns to breakout zone
- retest holds above support or resistance
- strong if bounce is supported by volume and trend alignment

### 6.8 Momentum Stock Detection
Requirements:
- strong price performance over 5/10/20 sessions
- moving average stack alignment
- relative strength above sector
- volume expansion

### 6.9 Near Breakout Candidates
Requirements:
- compare price distance to resistance/support
- show score if close to trigger zone
- highlight risk if pattern is still forming

### 6.10 Failed Breakout Detection
Requirements:
- breakout cross happens
- closes back inside range within same or next session
- volume fades
- signal reversion or trap risk

---

## 7. Technical Indicator Stack

### 7.1 RSI
- Compute 14-period RSI
- Bullish if RSI > 55 and rising
- Bearish if RSI < 45 and falling
- Divergence detection for reversal warnings

### 7.2 VWAP
- Intraday VWAP anchor
- Use as dynamic fair value line
- Flag above/below VWAP shifts in momentum

### 7.3 EMA20 / EMA50 / EMA200
- Use for trend direction and alignment
- Bullish stack: EMA20 > EMA50 > EMA200
- Bearish stack: EMA20 < EMA50 < EMA200

### 7.4 MACD
- Standard MACD histogram and signal line
- Bullish crossover = momentum improving
- Bearish crossover = downside acceleration

### 7.5 ATR
- Measure volatility and break risk
- Use for breakout validation and stop-loss placement

### 7.6 Bollinger Bands
- Detect squeeze and expansion
- Breakout from squeeze = high attention signal
- Use with volume confirmation

### 7.7 Support & Resistance
- Dynamic support and resistance by session and timeframe
- Combine pivot zones with recent highs/lows

### 7.8 Trend Strength
- Use directional alignment + price movement + EMA spread + volatility context

---

## 8. Smart Alert System

### Alert Types
- Bullish alerts
- Bearish alerts
- High-conviction alerts
- Trend reversal alerts
- Volume spike alerts
- Watchlist alerts

### Alert Rules
- Minimum confidence threshold: 60
- High conviction: confidence >= 80 and volume confirmation present
- Reversal: trend flips with support/resistance break and MACD/RSI change
- Volume spike: relative volume > 2.0x
- Watchlist: user-selected symbols with setup score crossing threshold

### Alert Lifecycle
1. Signal produced
2. Score computed
3. Validation checks run
4. Alert deduplicated
5. Send push / in-app / email if premium
6. Store in alert history

---

## 9. AI Explanation Feature

### Required Explanation Sections
- Why it triggered
- Which indicators confirmed it
- Risk factors
- Confidence score
- Bullish factors
- Bearish factors

### Output Example
```json
{
  "title": "Bullish breakout confirmed",
  "whyTriggered": "Price closed above resistance with 2.4x average volume.",
  "confirmedIndicators": ["EMA20 > EMA50", "RSI 61", "MACD bullish crossover", "VWAP above price intercept"],
  "riskFactors": ["Weak market sentiment", "Gap-up retracement risk", "High volatility"],
  "confidence": 84,
  "bullishFactors": ["Sector strength", "Volume expansion", "Trend alignment"],
  "bearishFactors": ["Possible exhaustion near recent highs", "Index weakness"],
  "suggestedAction": "Watch for retest and accumulation confirmation before entry"
}
```

### Rule-Based Narrative Template
- “Price broke above resistance at X with Yx average volume.”
- “Trend remains bullish because EMA20 is above EMA50 and EMA200.”
- “RSI and MACD confirm continuation, but risk remains if sector weakens.”

---

## 10. False Breakout Filtering

### 10.1 Confirmation Requirements
- Multi-timeframe alignment
- Candle close beyond level
- Relative volume above threshold
- Price accepted above/below level for at least 1 candle
- Trend alignment with sector or Nifty

### 10.2 Market Context Filters
- Nifty trend direction
- Sector strength
- Index relative performance
- Gap closure risk detection

### 10.3 Rejection Logic
Reject a breakout if:
- closes inside range after breaking
- volume is below average
- breakout is against dominant trend
- signal appears only in weak liquidity stock
- index and sector are negative while breakout is bullish

---

## 11. Scoring System

### Score Components
```ts
interface ScoreBundle {
  breakoutScore: number;
  trendScore: number;
  momentumScore: number;
  riskScore: number;
  confidenceScore: number;
}
```

### Example Calculation
```ts
const breakoutScore = (
  priceBreakQuality * 0.3 +
  volumeConfirmation * 0.2 +
  closeQuality * 0.2 +
  trendAlignment * 0.15 +
  atrValidation * 0.1 +
  sectorStrength * 0.05
);

const trendScore = (
  emaAlignment * 0.35 +
  structureStrength * 0.25 +
  marketContext * 0.2 +
  multiTimeframeTrend * 0.2
);

const momentumScore = (
  rsiStrength * 0.3 +
  macdStrength * 0.25 +
  roc * 0.2 +
  volumeSpike * 0.15 +
  relativeStrength * 0.1
);

const confidenceScore = (
  breakoutScore * 0.25 +
  trendScore * 0.2 +
  momentumScore * 0.2 +
  volumeConfirmation * 0.15 +
  sentimentContext * 0.1 +
  newsContext * 0.1
);
```

### Confidence Bands
- 0–39 = weak
- 40–59 = watchlist / neutral
- 60–79 = actionable
- 80–100 = high conviction

---

## 12. Probability Engine

### Probability Outputs
- Bullish Probability %
- Bearish Probability %
- Neutral Probability %

### Logic
- weighted bullish strength from breakout, trend, momentum, index alignment
- weighted bearish strength from breakdown, risk, negative MACD, weak sector trend
- neutral probability remains when conflicting signals exist

### Example
```ts
const bullishProbability = Math.min(100, bullishScoreWeight * 100);
const bearishProbability = Math.min(100, bearishScoreWeight * 100);
const neutralProbability = 100 - bullishProbability - bearishProbability;
```

---

## 13. News Intelligence

### Functional Requirements
- Analyze company news
- Sentiment scoring
- News impact rating
- Event detection
- Earnings-related moves
- Insider activity detection
- Sector news impact

### Data Sources
- Company announcements
- NSE and exchange notices
- News feed ingestion
- Sector headlines
- Regulatory filings

### Scoring model
- Positive news = bullish sentiment boost
- Negative news = bearish sentiment drag
- Major event = increased risk factor in alert explanation

---

## 14. Market Intelligence Features

### Widgets and Signals
- Top Gainers
- Top Losers
- Unusual Volume
- Sector Rotation
- Relative Strength Leaders
- Smart Money Candidates
- Institutional Buying Candidates

### Logic
- top gainers: rank by % move and relative volume
- top losers: reverse rules
- unusual volume: current volume > x times average and price movement confirms the move
- sector rotation: compare sector index momentum vs broader market
- smart money candidates: price leadership with rising volume and strong trend

---

## 15. Premium Features

### Premium Tier Features
- Advanced breakout scanner
- AI trade explanations
- Intraday scanner
- Swing trade scanner
- Portfolio analysis
- Personalized alerts
- Sector analysis
- Probability engine

### Tiering Strategy
- Free: basic scanner, limited alerts, watchlist
- Pro: advanced scanner, deeper score breakdown, AI explanations
- Elite: portfolio health, custom signals, premium market intelligence

---

## 16. Dashboard Enhancements

### Layout Modules
1. Market Pulse
   - Nifty trend
   - sector heatmap
   - volatility meter
   - top movers

2. Scanner Board
   - bullish, bearish, neutral setups
   - filter by timeframe, sector, confidence

3. Watchlist Panel
   - user symbols with scorecards
   - status labels
   - alerts summary

4. News and Catalyst Panel
   - event impact, sentiment score, stock-specific news

5. AI Insight Panel
   - score explanation card
   - risk evaluation
   - suggested action and confidence

### UX Principles
- score-first design
- minimal noise
- signal cards with explainability
- market context always visible

---

## 17. API Design

### Core Endpoints
- GET /api/market/overview
- GET /api/scanner/breakouts
- GET /api/scanner/breakdowns
- GET /api/scanner/orb
- GET /api/scanner/watchlist
- GET /api/market/sectors
- GET /api/news/symbol/:symbol
- GET /api/alerts
- POST /api/alerts/:id/read

### Request Example
```json
{
  "timeframe": "1d",
  "minConfidence": 70,
  "sector": "IT",
  "market": "NIFTY500"
}
```

### Response Example
```json
{
  "signals": [
    {
      "symbol": "RELIANCE",
      "direction": "bullish",
      "confidence": 84,
      "signalType": "breakout",
      "bullishProbability": 73,
      "bearishProbability": 18,
      "neutralProbability": 9
    }
  ]
}
```

---

## 18. Backend Processing Flow

### Pipeline
1. Fetch candles for symbol and timeframes
2. Compute indicators: EMA, RSI, MACD, ATR, VWAP, Bollinger
3. Update support and resistance zones
4. Evaluate breakout/breakdown conditions
5. Apply false breakout filters
6. Compute risk and confidence scores
7. Generate probability engine output
8. Create AI explanation
9. Push alert if threshold met
10. Persist to DB and dashboard cache

---

## 19. Frontend Feature Modules

### Dashboard Views
- Overview
- Scanner
- Watchlist
- Market Leaders
- News & Sentiment
- Alerts
- Portfolio

### Reusable UI Components
- Score Pill
- Signal Card
- Alert Banner
- Sector Heatmap
- Market Index Strip
- Watchlist Row
- News Card
- Explanation Drawer
- Breakout Detail Panel

---

## 20. Acceptance Criteria

### Functional
- A user can see bullish and bearish signals
- Each signal has a confidence score and probability breakdown
- A signal includes risk and explanation data
- False breakout filters reduce low-quality trades
- Watchlist lets users track chosen symbols
- Alerts are clear and actionable

### Non-Functional
- Data updates within acceptable intraday refresh intervals
- Dashboard loads within target time
- Scanner logic is deterministic and explainable
- Alert generation is deduplicated
- Risk and confidence values are consistent with underlying data

---

## 21. MVP Build Plan

### Phase 1: Core Scanner
- Daily breakout detection
- Support/resistance zones
- Volume filter
- Risk score
- Alert generation

### Phase 2: Technical Layer
- RSI, MACD, EMA, ATR, VWAP, Bollinger
- Trend scoring
- Probability engine
- False breakout filtering

### Phase 3: AI + Insights
- Alert explanations
- News integration
- Sector context
- High conviction logic

### Phase 4: Dashboard & Premium
- Dashboard widgets
- Watchlists
- Personalized alerts
- Premium plan gating

---

## 22. Recommended Priority Order

1. Breakout + breakdown scanner
2. Volume confirmation + false breakout filter
3. Confidence score + probability engine
4. AI explanation generator
5. ORB and momentum scanner
6. Sector and market intelligence
7. Watchlists and alerts
8. Premium dashboard and monetization layer

---

## 23. Product Recommendation
The strongest differentiator for this app is not “more indicators,” but “better signal quality + better explanations.”

The winning strategy is:
- scan the market for tradeable setups
- validate each setup with volume, trend, and risk filters
- explain the logic simply
- rank them by confidence and probability
- let users act on trustworthy, contextual alerts

This approach is far more powerful than a generic stock screener that simply lists bullish names.

---

## 24. Summary
This implementation spec turns the strategy into a buildable product blueprint. The app should focus on high-quality setup detection, false-positive filtering, and clear AI reasoning. This makes it stand out from traditional Indian stock tools and creates a strong foundation for both free and premium tiers.

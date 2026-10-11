# Stock Scanner MVP Roadmap

## 1. Goal
Build a usable Indian stock scanner MVP focused on breakout detection, volume analysis, confidence scoring, and AI-style explanations. The goal is to deliver a feature-rich but realistic first version that users can trust and keep using.

---

## 2. Product Strategy
The product should feel like a decision-support tool, not a noisy signal feed.

Key principles:
- quality over quantity
- signals should be explainable
- keep filters strong to reduce false breakouts
- show users the "why" behind each alert
- prioritize confidence and market context above raw indicator count

---

## 3. MVP Core Features

### Phase 1: Core Scanner
- Resistance breakout detection
- Support breakdown detection
- Volume breakout detection
- Gap-up / gap-down detection
- ORB (Opening Range Breakout)
- Near breakout watchlist
- Failed breakout detection
- Watchlist alerts

### Phase 2: Technical Layer
- RSI
- VWAP
- EMA20, EMA50, EMA200
- MACD
- ATR
- Bollinger Bands
- Trend strength
- Support and resistance levels

### Phase 3: Intelligence Layer
- Breakout score
- Trend score
- Momentum score
- Risk score
- Confidence score
- Bullish / bearish / neutral probability
- AI explanation for each signal

### Phase 4: Market Intelligence
- Top gainers / losers
- Unusual volume
- Sector rotation
- Relative strength leaders
- Smart money candidate signals

### Phase 5: Dashboard + Retention
- Market pulse widget
- Scanner board
- Watchlist dashboard
- Alert center
- News and event panel
- AI explanation drawer

---

## 4. MVP Scope by Priority

### Priority 1: Must Have
- Breakout scanner
- Breakdown scanner
- Volume filter
- Confidence score
- AI explanation
- Watchlist scanning
- Alert generation

### Priority 2: Should Have
- ORB scanner
- Failed breakout detection
- Near breakout candidates
- Sector trend context
- Relative strength rankings

### Priority 3: Nice to Have
- News sentiment
- Smart money screening
- Premium-only modules
- Portfolio analysis

---

## 5. Suggested Product Architecture

### Frontend
- Next.js app with dashboard UI
- Scanner page
- Watchlist page
- Alert center
- Signal detail component
- Market overview widgets

### Backend
- API routes for scanner results
- Background job for signal generation
- Database for candles, signals, alerts, and watchlists
- Rule engine for technical checks

### Data Flow
1. Load latest NSE candles
2. Compute indicators
3. Detect support/resistance levels
4. Run breakout rules
5. Apply false breakout filters
6. Calculate scores
7. Create alert records
8. Display summary on dashboard

---

## 6. Suggested Database Tables

### symbols
- id
- symbol
- company_name
- sector
- exchange
- active

### candles
- id
- symbol
- timeframe
- timestamp
- open
- high
- low
- close
- volume

### support_resistance
- id
- symbol
- timeframe
- level
- type
- strength
- created_at

### signals
- id
- symbol
- type
- direction
- breakout_score
- trend_score
- momentum_score
- risk_score
- confidence_score
- bullish_probability
- bearish_probability
- neutral_probability
- status
- created_at

### alerts
- id
- symbol
- alert_type
- title
- message
- trigger_reason
- confidence
- created_at
- is_read

### watchlists
- id
- user_id
- symbol
- note

---

## 7. Signal Scoring Model

### Score Formula Example
```ts
const confidenceScore = (
  breakoutScore * 0.25 +
  trendScore * 0.2 +
  momentumScore * 0.2 +
  riskScore * 0.15 +
  volumeConfirmation * 0.1 +
  marketContext * 0.1
);
```

### Risk model
- high volatility = more risk
- gap closure = stronger risk penalty
- low relative volume = risk penalty
- weak market context = risk penalty
- large distance from support/resistance = can lower quality, depending on setup

### Probability model
- Bullish probability = weighted bullish setup confidence
- Bearish probability = weighted bearish setup confidence
- Neutral probability = remaining share when signals conflict

---

## 8. False Breakout Filtering Strategy

### Required filters
- Breakout must close beyond the level
- Use relative volume threshold
- Confirm with at least one higher timeframe check
- Ignore breakouts against dominant trend
- Reject low-liquidity setups
- Penalize gap-fill risks

### Example rules
- if volume < 1.5x average volume => downgrade signal
- if close fails to hold above resistance for next candle => downgrade or invalidate
- if index is weak while stock is bullish => reduce confidence
- if ATR is too small for move size => treat as noise

---

## 9. AI Explanation Pipeline

### Input
- signal type
- price break level
- volume data
- indicator values
- sector and market trend
- risk profile

### Output
A short, structured explanation:
- why it triggered
- technical confirmation
- risk factors
- bullish factors
- bearish factors
- confidence score

### Example output
```json
{
  "title": "Bullish breakout confirmed",
  "whyTriggered": "Price closed above resistance with 2.3x average volume.",
  "confirmedIndicators": ["EMA20 > EMA50", "RSI above 58", "MACD bullish crossover"],
  "riskFactors": ["Market weakness", "Possible retest risk"],
  "bullishFactors": ["Strong volume", "Sector leader", "Trend alignment"],
  "bearishFactors": ["Overextended move", "High volatility"],
  "confidence": 84
}
```

---

## 10. Dashboard Modules

### Dashboard Layout
- Header: market overview, Nifty sentiment, market breadth
- Main scanner board: breakout list, breakdown list, near breakout list
- Right panel: AI explanation and signal detail
- Bottom panel: sector heatmap and news feed

### Widgets
- Top gainers
- Top losers
- Unusual volume
- Relative strength leaders
- Sector heatmap
- Watchlist scorecards
- Alert timeline
- Setup detail drawer

---

## 11. MVP User Journey

### User enters app
- sees market pulse cards
- sees scanner results for bullish/bearish setups
- sees watchlist of near-breakout names
- clicks any signal card
- sees explanation, scores, and risk context
- sees suggested action and confidence

### User adds stock to watchlist
- alert triggers when condition is met
- app sends in-app push or watchlist update
- user can review signal details and reasoning

---

## 12. MVP Timeline (8–10 Weeks)

### Week 1–2: Foundation
- setup project structure
- fetch NSE data
- build candle model and storage
- create data pipeline

### Week 3–4: Indicators + trend engine
- RSI, EMA, MACD, ATR, Bollinger
- VWAP and trend strength logic
- support/resistance zones

### Week 5: Scanner engine
- breakout detection
- breakdown detection
- volume conditions
- near breakout candidate logic

### Week 6: Scoring + explanation
- confidence score
- probability engine
- alert explanation output
- false breakout filters

### Week 7: Dashboard UI
- scanner view
- watchlist view
- alert center
- score cards

### Week 8: Final polish
- bug fixes
- UX improvements
- alert deduplication
- production readiness checks

---

## 13. Recommended MVP Launch Features
To keep the first release focused, launch with:
- bullish and bearish breakout scanner
- volume confirmation
- AI explanation panel
- confidence score
- watchlist alerts
- top movers + sector overview

This is the right minimum viable product because it provides value immediately without requiring a full trading terminal.

---

## 14. Success Metrics
- active scan result quality
- alert click-through rate
- user retention on scanner dashboard
- % of alerts with explanation opened
- user watchlist growth
- average confidence of triggered setups

---

## 15. Risks to Mitigate
- false breakout noise
- weak liquidity names
- low-quality market data
- over-alerting due to poor filters
- confusing score outputs

Mitigation:
- strong confirmation rules
- sector and index validation
- high minimum confidence threshold
- explainable logic
- alert deduplication

---

## 16. Final Product Recommendation
The best MVP is not a giant terminal with every indicator. It is a focused scanner built around:
- high-quality breakout detection
- strong false-breakout protection
- score-based confidence
- practical explanations
- clean dashboard UX

That combination is what gives users trust and makes the product feel premium.

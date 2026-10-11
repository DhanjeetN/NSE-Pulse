# Stock Scanner Development Tasks

## 1. Project Goal
Build the MVP stock scanner app for NSE data with breakout detection, false breakout protection, confidence scoring, and AI-style alert explanations.

---

## 2. Project Phases

### Phase 1: Data Foundation
- [ ] Set up data model for symbols, candles, signals, alerts, and watchlists
- [ ] Build NSE data ingestion pipeline
- [ ] Store daily and intraday OHLCV candles
- [ ] Add index and sector metadata
- [ ] Add support for market overview and top movers data

### Phase 2: Technical Indicator Engine
- [ ] Compute EMA20, EMA50, EMA200
- [ ] Compute RSI
- [ ] Compute VWAP
- [ ] Compute MACD
- [ ] Compute ATR
- [ ] Compute Bollinger Bands
- [ ] Compute trend strength
- [ ] Compute support and resistance zones

### Phase 3: Scanner Engine
- [ ] Implement resistance breakout detection
- [ ] Implement support breakdown detection
- [ ] Implement consolidation breakout logic
- [ ] Implement volume breakout logic
- [ ] Implement gap-up/gap-down detection
- [ ] Implement ORB scanner
- [ ] Implement breakout retest logic
- [ ] Implement failed breakout logic
- [ ] Implement near-breakout candidate detection
- [ ] Implement momentum stock ranking

### Phase 4: Filtering and Scoring
- [ ] Add multi-timeframe confirmation logic
- [ ] Add candle close validation
- [ ] Add relative volume checks
- [ ] Add ATR validation
- [ ] Add trend alignment checks
- [ ] Add market sentiment validation
- [ ] Build breakout score
- [ ] Build trend score
- [ ] Build momentum score
- [ ] Build risk score
- [ ] Build confidence score
- [ ] Build bullish / bearish / neutral probability engine

### Phase 5: Alert System
- [ ] Trigger bullish alerts
- [ ] Trigger bearish alerts
- [ ] Trigger high-conviction alerts
- [ ] Trigger reversal alerts
- [ ] Trigger volume spike alerts
- [ ] Trigger watchlist alerts
- [ ] Deduplicate repeated alerts
- [ ] Add alert read state
- [ ] Add in-app notification display

### Phase 6: AI Explanation Layer
- [ ] Build explanation template engine
- [ ] Generate trigger reason
- [ ] Generate indicator confirmation summary
- [ ] Generate risk factors
- [ ] Generate bullish/bearish factors
- [ ] Attach confidence score to each alert
- [ ] Create summary text for each signal card

### Phase 7: Dashboard UI
- [ ] Build market pulse widget
- [ ] Build scanner board
- [ ] Build watchlist panel
- [ ] Build sector heatmap widget
- [ ] Build top gainers / losers panel
- [ ] Build unusual volume panel
- [ ] Build AI explanation drawer
- [ ] Build alert center
- [ ] Add score-based card UI

### Phase 8: Premium / Growth
- [ ] Add premium gating system
- [ ] Add advanced breakout scanner
- [ ] Add AI trade explanations for premium
- [ ] Add sector intelligence
- [ ] Add personalized alerts
- [ ] Add portfolio analysis module

---

## 3. Module-by-Module Tasks

### 3.1 Data Ingestion
- [ ] Create symbol master list from NSE market universe
- [ ] Create daily candle fetcher
- [ ] Create intraday candle fetcher
- [ ] Add cached refresh scheduler
- [ ] Add fallback for missing candle data
- [ ] Add data validation for OHLCV consistency

### 3.2 Indicator Engine
- [ ] Implement EMA calculation utilities
- [ ] Implement RSI calculation utilities
- [ ] Implement MACD calculation utilities
- [ ] Implement ATR calculation utilities
- [ ] Implement VWAP calculation utilities
- [ ] Implement Bollinger calculation utilities
- [ ] Store computed indicator values per symbol + timeframe

### 3.3 Support/Resistance Engine
- [ ] Detect recent swing highs and lows
- [ ] Create resistance zone list
- [ ] Create support zone list
- [ ] Rank zone strength
- [ ] Attach zones to active signals

### 3.4 Breakout Detector
- [ ] Define breakout threshold rules
- [ ] Detect close above resistance
- [ ] Detect close below support
- [ ] Score directional quality
- [ ] Filter using volume and trend checks

### 3.5 ORB Detector
- [ ] Define first 15m/30m range
- [ ] Track ORB high and low
- [ ] Detect bullish and bearish ORB
- [ ] Add volume and trend validation

### 3.6 Momentum Detector
- [ ] Identify strong trend names
- [ ] Calculate relative strength
- [ ] Detect trend acceleration
- [ ] Create momentum shortlist

### 3.7 Watchlist + Near Breakout
- [ ] Allow user watchlist creation
- [ ] Add near breakout status to watchlist rows
- [ ] Trigger alerts when stocks reach predefined thresholds
- [ ] Sort watchlist by score and urgency

### 3.8 Alert Engine
- [ ] Map detection results to alert types
- [ ] Assign confidence score
- [ ] Attach explanation metadata
- [ ] Send alert only if threshold met
- [ ] Prevent duplicate alerts within cooling period

### 3.9 Dashboard Components
- [ ] Build overview page
- [ ] Build scanner results grid
- [ ] Build stock detail sidebar
- [ ] Build alert summary card
- [ ] Build market overview cards
- [ ] Build sector heatmap
- [ ] Build news panel

---

## 4. API Task List

### Market Endpoints
- [ ] GET /api/market/overview
- [ ] GET /api/market/top-gainers
- [ ] GET /api/market/top-losers
- [ ] GET /api/market/unusual-volume
- [ ] GET /api/market/sector-rotation

### Scanner Endpoints
- [ ] GET /api/scanner/breakouts
- [ ] GET /api/scanner/breakdowns
- [ ] GET /api/scanner/orb
- [ ] GET /api/scanner/momentum
- [ ] GET /api/scanner/near-breakout
- [ ] GET /api/scanner/failed-breakouts

### Alert Endpoints
- [ ] GET /api/alerts
- [ ] POST /api/alerts/:id/read
- [ ] GET /api/watchlist
- [ ] POST /api/watchlist

### Signal Detail Endpoints
- [ ] GET /api/signals/:symbol
- [ ] GET /api/signals/:symbol/explanation

---

## 5. Frontend Task List

### Page Structure
- [ ] Home dashboard
- [ ] Scanner page
- [ ] Watchlist page
- [ ] Alerts page
- [ ] Sector page
- [ ] Stock detail page

### Components
- [ ] SignalCard
- [ ] ScoreBadge
- [ ] AlertBadge
- [ ] MarketOverviewCard
- [ ] SectorHeatmap
- [ ] WatchlistTable
- [ ] ExplanationDrawer
- [ ] SignalFilterPanel
- [ ] TopMoversList

---

## 6. Quality Checks

### Validation Tasks
- [ ] Verify breakout signals produce minimal false positives
- [ ] Verify confidence score is stable across repeated runs
- [ ] Validate all alerts have explanation metadata
- [ ] Validate no duplicate alerts in same cooldown period
- [ ] Validate watchlist alert triggers correctly
- [ ] Validate sector trend influence on signals
- [ ] Validate ORB logic in intraday sessions

### Edge Cases
- [ ] Low liquidity stock handling
- [ ] Data missing for some stocks
- [ ] Gaps that immediately reverse
- [ ] Re-test confirmations that fail
- [ ] Range-bound names with weak momentum

---

## 7. Recommended Implementation Order

### Sprint 1
- Data pipeline and candle storage
- EMA/RSI/MACD/ATR/VWAP/Bollinger utilities
- Simple breakout detection
- Basic score calculation

### Sprint 2
- Support/resistance zones
- ORB and volume logic
- False breakout filters
- Alert creation and dedupe

### Sprint 3
- AI explanation generation
- Dashboard UI and watchlist
- Sector overview and top movers

### Sprint 4
- Premium gating
- Personalized alerts
- Advanced scanning and polish

---

## 8. Definition of Done
A task is done when:
- logic is implemented and tested
- scoring is visible in UI
- explanation is available for the signal
- false breakout filter is applied
- alert triggers correctly
- signal state is stored persistently

---

## 9. MVP Success Criteria
- Users can view bullish and bearish signals
- Score and probability are visible for every setup
- Each alert explains its reasoning
- False breakout filtering is working
- Dashboard feels clear and actionable
- Significant value exists without premium features

---

## 10. Suggested Next Build Step
The next immediate coding tasks to implement are:
1. data ingestion for candles and symbols
2. indicator utilities
3. breakout and breakdown detection
4. score calculation
5. alert generation with explanations

That sequence creates the core value quickly and keeps the build grounded in real market data.

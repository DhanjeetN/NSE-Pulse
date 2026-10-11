# Stock Scanner Complete Plan

## 1. Product Overview
Build an Indian stock scanner that helps users discover high-probability bullish and bearish setups using NSE data, technical indicators, market context, and AI-supported explanation layers. The product should prioritize signal quality, false breakout filtering, confidence scoring, and clarity of reasoning instead of simply showing raw stock movements.

Target outcome:
- detect high-quality trade setups
- reduce false breakout noise
- explain why a signal exists
- help users act with confidence and context
- provide a premium product experience for traders

---

## 2. Core Product Features

### Core Scanning Features
- Resistance breakout detection
- Support breakdown detection
- Consolidation breakout detection
- Volume breakout detection
- Gap-up and gap-down detection
- Opening Range Breakout (ORB)
- Breakout retest detection
- Momentum stock detection
- Near breakout candidates
- Failed breakout detection

### Technical Analysis Features
- RSI
- VWAP
- EMA20
- EMA50
- EMA200
- MACD
- ATR
- Bollinger Bands
- Support and Resistance
- Trend Strength

### Smart Alerts
- Bullish alerts
- Bearish alerts
- High conviction alerts
- Trend reversal alerts
- Volume spike alerts
- Watchlist alerts

### AI Explanation Layer
Each alert should explain:
- Why it triggered
- Which indicators confirmed it
- Risk factors
- Confidence score
- Bullish factors
- Bearish factors

### False Breakout Filtering
- Multi-timeframe confirmation
- Candle close confirmation
- Relative volume checks
- ATR checks
- Trend alignment checks
- Market sentiment validation

### Market Intelligence
- Top Gainers
- Top Losers
- Unusual Volume
- Sector Rotation
- Relative Strength Leaders
- Smart Money Candidates
- Institutional Buying Candidates

---

## 3. Feature Blueprint

### 3.1 Resistance Breakout Detection
Use when price closes above a key resistance zone.
Requirements:
- close above resistance
- strong volume confirmation
- trend alignment with EMA stack
- strong candle close quality
- no major contradiction from broader market trend

### 3.2 Support Breakdown Detection
Use when price closes below support.
Requirements:
- close below support zone
- candlestick weakness
- increase in volume
- bearish MACD / RSI conditions
- index or sector weakness

### 3.3 Consolidation Breakout Detection
Use when price is range-bound before a directional move.
Requirements:
- narrow consolidation range
- volume expansion at break
- decisive close beyond range
- continuation quality checks

### 3.4 Volume Breakout Detection
Use when price movement is backed by unusually high participation.
Requirements:
- volume > 1.5x to 2.5x average
- break beyond key threshold
- follow-through or acceptance of move

### 3.5 Gap-Up and Gap-Down Detection
Detects abrupt price moves at market open.
Requirements:
- gap relative to previous close
- follow-through in first 15 to 30 minutes
- market sentiment confirmation

### 3.6 ORB Detection
Opening range breakout at first intraday session window.
Requirements:
- define opening range
- break above range high or below range low
- positivity from volume and trend

### 3.7 Breakout Retest Detection
Detect whether breakout retests level and holds.
Requirements:
- initial breakout occurs
- retest of breakout zone
- close remains beyond breakout zone
- support or resistance holds

### 3.8 Momentum Stock Detection
Find stocks with directional acceleration and strong trend structure.
Requirements:
- price momentum
- volume expansion
- relative strength vs index/sector
- moving average alignment

### 3.9 Near Breakout Candidates
Highlight names approaching key levels without yet triggering.
Requirements:
- distance to breakout zone
- volatility context
- near-signal score
- trend and volume support

### 3.10 Failed Breakout Detection
Detect stocks that break and then fail immediately.
Requirements:
- temporary breakout above/below level
- close back inside range
- fading volume
- risk of reversal

---

## 4. Technical Analysis Stack

### RSI
- 14-period RSI
- bullish or bearish momentum depending on relative position
- divergence detection for reversal alerts

### VWAP
- intraday fair value line
- above VWAP indicates bullish bias
- below VWAP indicates bearish bias

### EMA20 / EMA50 / EMA200
- short-term, mid-term, long-term trend structure
- trend alignment checks

### MACD
- crossover and histogram strength
- momentum difference confirmation

### ATR
- volatility gauge
- stop-loss and breakout quality validation

### Bollinger Bands
- squeeze and expansion detection
- volatility breakout signals

### Support & Resistance
- dynamic zones from price structure and pivot levels

### Trend Strength
- measures alignment, continuity, and directionality of trend

---

## 5. Score Design

### Score Components
- Breakout Score (0-100)
- Trend Score (0-100)
- Momentum Score (0-100)
- Risk Score (0-100)
- Confidence Score (0-100)

### Breakout Score Inputs
- break quality
- volume confirmation
- close quality
- trend alignment
- ATR validation
- sector strength

### Trend Score Inputs
- EMA alignment
- structure quality
- market context
- higher timeframe trend confirmation

### Momentum Score Inputs
- RSI strength
- MACD strength
- rate of change
- relative strength
- volume spike intensity

### Risk Score Inputs
- volatility
- liquidity quality
- false breakout exposure
- event risk
- weak market conditions

### Confidence Score Inputs
- breakout score
- trend score
- momentum score
- volume confirmation
- market sentiment confirmation
- news context

---

## 6. Probability Engine

### Output
- Bullish Probability %
- Bearish Probability %
- Neutral Probability %

### Logic
Bullish probability rises with:
- breakout confirmation
- trend alignment
- volume support
- positive sector movement
- relative strength

Bearish probability rises with:
- support breakdown
- weak trend structure
- negative momentum
- declining volume quality
- sector weakness

Neutral probability rises when:
- trend and momentum conflict
- price is choppy
- signals are mixed across timeframes

---

## 7. AI Explanation System

### Required Fields
- Trigger reason
- Why it triggered
- Indicators that confirmed it
- Risk factors
- Confidence score
- Bullish factors
- Bearish factors
- Suggested action

### Example Output
```json
{
  "reason": "Price closed above resistance with strong relative volume.",
  "confirmedIndicators": ["EMA20 > EMA50", "RSI > 58", "MACD bullish crossover"],
  "riskFactors": ["Market weakness", "Possible retest risk", "High volatility"],
  "confidence": 84,
  "bullishFactors": ["Volume expansion", "Trend alignment", "Sector leadership"],
  "bearishFactors": ["Overextended move", "Gap fill risk"],
  "suggestedAction": "Watch for retest and accumulation before adding risk."
}
```

---

## 8. False Breakout Filters

### Main Filters
- Multi-timeframe confirmation
- Candle close confirmation
- Relative volume checks
- ATR checks
- Trend alignment checks
- Market sentiment validation

### Additional Rules
- Ignore breakouts that close inside the range
- Require strong volume for breakout validity
- Reject weak breakouts against broader trend
- Use sector and index context before promoting signal

---

## 9. Premium Features

- Advanced breakout scanner
- AI trade explanations
- Intraday scanner
- Swing trade scanner
- Portfolio analysis
- Personalized alerts
- Sector analysis
- Probability engine
- Smart watchlist ranking

---

## 10. Retention Features

- Daily market summary
- Personalized watchlist
- Signal digest
- High-conviction cards
- Near-breakout reminders
- Saved scan preferences
- Learning layer explaining setups

---

## 11. Monetization Ideas

- Freemium scanner
- Pro breakout model
- Premium AI explanations
- Intraday subscription
- Sector intelligence plan
- Portfolio tracking add-on
- Custom alert and watchlist plans

---

## 12. Dashboard Enhancements

### Widgets
- Market pulse
- Sector heatmap
- Scanner board
- Watchlist board
- AI explanation panel
- News impact panel
- Breakout leaderboard
- Risk radar
- Trend strength meter

### Influence
Inspired by:
- TradingView
- Zerodha Kite
- Trendlyne
- Chartink

---

## 13. Unique Features

- Probability-based trade grading
- AI explanation per setup
- False breakout filter engine
- Sector-relative breakout ranking
- Smart money candidate detection
- Event-driven setup intelligence
- Multi-timeframe validation
- Near-breakout radar

---

## 14. Top 20 High-Value Features To Build Next

1. Breakout scanner with volume confirmation
2. Support breakdown scanner
3. Consolidation breakout detector
4. ORB scanner
5. Breakout retest detector
6. Failed breakout classifier
7. Momentum stock ranking
8. Near breakout watchlist
9. Trend strength engine
10. Probability engine
11. Confidence score model
12. AI alert explanation layer
13. Sector rotation analysis
14. Unusual volume tracker
15. Relative strength leaderboard
16. News sentiment scoring
17. Event impact engine
18. Portfolio risk analysis
19. Watchlist alert automation
20. Premium dashboard with scorecards

---

## 15. MVP Roadmap

### Phase 1: Foundation
- NSE data ingest
- candle storage
- support/resistance basics
- spread of intraday data

### Phase 2: Signal Engine
- breakout detection
- breakdown detection
- volume validation
- ORB logic

### Phase 3: Score & Explanation
- scoring model
- probability engine
- false breakout filters
- risk calculations

### Phase 4: Dashboard
- scanner board
- watchlists
- alerts
- scorecards

### Phase 5: Premium Layer
- AI explanations
- sector intelligence
- personalized alerts
- advanced dashboard widgets

---

## 16. Recommended MVP Launch Set
The best first release should include:
- Breakout detection
- Breakdown detection
- Volume confirmation
- Confidence score
- False breakout filter
- AI explanation
- Sector context
- Alert generation

This provides a strong, not overly broad, first product that users can trust and use daily.

---

## 17. Implementation Notes
This project should focus on quality of signal generation rather than quantity of indicators. The winning model is:
- scan broad universe
- validate each setup with volume, trend, and structure
- explain the setup in human terms
- rank by confidence and risk

That ensures the app feels like a real decision support tool rather than a generic stock list.

---

## 18. Related Files in the Project
- [STOCK_SCANNER_FEATURE_BLUEPRINT.md](STOCK_SCANNER_FEATURE_BLUEPRINT.md)
- [STOCK_SCANNER_IMPLEMENTATION_SPEC.md](STOCK_SCANNER_IMPLEMENTATION_SPEC.md)
- [STOCK_SCANNER_MVP_ROADMAP.md](STOCK_SCANNER_MVP_ROADMAP.md)

---

## 19. Best Next Action
The recommended next step is to turn this into an actual execution plan for the app codebase:
1. define the scanner API endpoints
2. build signal generation services
3. create the dashboard view
4. program the alert engine
5. validate with a small watchlist and data sample

This is the right path to move from concept to working product without overbuilding too early.

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const nseSessionFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function isWithinNseSession(timestamp) {
  const parts = Object.fromEntries(nseSessionFormatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const time = Number(parts.hour) * 100 + Number(parts.minute);
  return day >= 1 && day <= 5 && time >= 915 && time <= 1530;
}

export function evaluateIndexSnapshotBias(snapshot = {}, { now = Date.now() } = {}) {
  const current = Number(snapshot.currentPrice);
  const open = Number(snapshot.open);
  const high = Number(snapshot.high);
  const low = Number(snapshot.low);
  const previousClose = Number(snapshot.previousClose);
  const change = Number(snapshot.percentChange);

  if (![current, open, high, low, previousClose, change].every(Number.isFinite)
    || current <= 0 || open <= 0 || previousClose <= 0 || high <= low) {
    return {
      bias: 'Unavailable',
      marketStatus: isWithinNseSession(now) ? 'Market open' : 'Market closed',
      reasons: ['NSE index snapshot is missing valid open, high, low, previous close, or change data.'],
    };
  }

  const rangePosition = (current - low) / (high - low);
  const bullish = current > open
    && current > previousClose
    && change > 0
    && rangePosition >= 0.6;
  const bearish = current < open
    && current < previousClose
    && change < 0
    && rangePosition <= 0.4;
  const marketOpen = isWithinNseSession(now);

  if (bullish) {
    return {
      bias: 'Bullish bias',
      marketStatus: marketOpen ? 'Market open' : 'Market closed · last snapshot',
      reasons: ['NIFTY 50 is above its open and previous close, and in the upper part of its session range.'],
    };
  }
  if (bearish) {
    return {
      bias: 'Bearish bias',
      marketStatus: marketOpen ? 'Market open' : 'Market closed · last snapshot',
      reasons: ['NIFTY 50 is below its open and previous close, and in the lower part of its session range.'],
    };
  }

  return {
    bias: 'Mixed / no bias',
    marketStatus: marketOpen ? 'Market open' : 'Market closed · last snapshot',
    reasons: ['NIFTY 50 does not have aligned direction and session-range confirmation in this snapshot.'],
  };
}

function calculateEma(values, period) {
  const result = Array(values.length).fill(null);
  if (values.length < period) return result;
  const multiplier = 2 / (period + 1);
  let average = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = average;

  for (let index = period; index < values.length; index += 1) {
    average = values[index] * multiplier + average * (1 - multiplier);
    result[index] = average;
  }
  return result;
}

function calculateRsiSeries(values, period = 14) {
  const result = Array(values.length).fill(null);
  if (values.length <= period) return result;

  let averageGain = 0;
  let averageLoss = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain += Math.max(change, 0);
    averageLoss += Math.max(-change, 0);
  }
  averageGain /= period;
  averageLoss /= period;
  result[period] = averageLoss === 0 ? 100 : 100 - (100 / (1 + averageGain / averageLoss));

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
    result[index] = averageLoss === 0 ? 100 : 100 - (100 / (1 + averageGain / averageLoss));
  }
  return result;
}

function calculateAdx(candles, period = 14) {
  if (candles.length < period * 2 + 1) return null;
  const trueRanges = Array(candles.length).fill(0);
  const positiveMoves = Array(candles.length).fill(0);
  const negativeMoves = Array(candles.length).fill(0);

  for (let index = 1; index < candles.length; index += 1) {
    const current = candles[index];
    const previous = candles[index - 1];
    trueRanges[index] = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    );
    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;
    if (upMove > downMove && upMove > 0) positiveMoves[index] = upMove;
    if (downMove > upMove && downMove > 0) negativeMoves[index] = downMove;
  }

  let smoothedTr = trueRanges.slice(1, period + 1).reduce((sum, value) => sum + value, 0);
  let smoothedPlus = positiveMoves.slice(1, period + 1).reduce((sum, value) => sum + value, 0);
  let smoothedMinus = negativeMoves.slice(1, period + 1).reduce((sum, value) => sum + value, 0);
  const dxValues = Array(candles.length).fill(null);

  for (let index = period; index < candles.length; index += 1) {
    if (index > period) {
      smoothedTr = smoothedTr - smoothedTr / period + trueRanges[index];
      smoothedPlus = smoothedPlus - smoothedPlus / period + positiveMoves[index];
      smoothedMinus = smoothedMinus - smoothedMinus / period + negativeMoves[index];
    }
    if (smoothedTr === 0) continue;
    const plusDi = 100 * smoothedPlus / smoothedTr;
    const minusDi = 100 * smoothedMinus / smoothedTr;
    const diSum = plusDi + minusDi;
    dxValues[index] = diSum === 0 ? 0 : 100 * Math.abs(plusDi - minusDi) / diSum;
  }

  const firstAdxIndex = period * 2 - 1;
  let adx = dxValues.slice(period, firstAdxIndex + 1).reduce((sum, value) => sum + (value ?? 0), 0) / period;
  for (let index = firstAdxIndex + 1; index < candles.length; index += 1) {
    adx = (adx * (period - 1) + (dxValues[index] ?? 0)) / period;
  }
  return adx;
}

function calculateSupertrend(candles, period = 10, multiplier = 3) {
  if (candles.length < period) return null;
  const trueRanges = candles.map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    const previousClose = candles[index - 1].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });
  let atr = trueRanges.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  let previousUpper = (candles[period - 1].high + candles[period - 1].low) / 2 + multiplier * atr;
  let previousLower = (candles[period - 1].high + candles[period - 1].low) / 2 - multiplier * atr;
  let direction = 1;
  let supertrend = previousLower;

  for (let index = period; index < candles.length; index += 1) {
    atr = (atr * (period - 1) + trueRanges[index]) / period;
    const midpoint = (candles[index].high + candles[index].low) / 2;
    const basicUpper = midpoint + multiplier * atr;
    const basicLower = midpoint - multiplier * atr;
    const upper = basicUpper < previousUpper || candles[index - 1].close > previousUpper
      ? basicUpper
      : previousUpper;
    const lower = basicLower > previousLower || candles[index - 1].close < previousLower
      ? basicLower
      : previousLower;

    if (direction === 1 && candles[index].close < lower) direction = -1;
    else if (direction === -1 && candles[index].close > upper) direction = 1;

    supertrend = direction === 1 ? lower : upper;
    previousUpper = upper;
    previousLower = lower;
  }

  return { value: supertrend, direction: direction === 1 ? 'Bullish' : 'Bearish' };
}

function nseDateAndMinutes(timestamp) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp * 1000)).map(({ type, value }) => [type, value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function calculateIntradayIndicators(candles = []) {
  const validCandles = candles
    .filter((candle) => candle
      && Number.isFinite(candle.timestamp)
      && [candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite)
      && candle.close > 0)
    .sort((left, right) => left.timestamp - right.timestamp);

  if (validCandles.length < 35) {
    return { ready: false, reason: 'At least 35 valid 5-minute candles are required.' };
  }

  const closes = validCandles.map((candle) => candle.close);
  const ema9 = calculateEma(closes, 9).at(-1);
  const ema20 = calculateEma(closes, 20).at(-1);
  const ema50 = calculateEma(closes, 50).at(-1);
  const ema200 = calculateEma(closes, 200).at(-1);
  const rsiSeries = calculateRsiSeries(closes);
  const rsi = rsiSeries.at(-1);
  const fastEma = calculateEma(closes, 12);
  const slowEma = calculateEma(closes, 26);
  const macdLine = fastEma.map((value, index) => (
    value === null || slowEma[index] === null ? null : value - slowEma[index]
  ));
  const validMacd = macdLine.filter((value) => value !== null);
  const signalLine = calculateEma(validMacd, 9);
  const macd = validMacd.at(-1);
  const macdSignal = signalLine.at(-1);
  const adx = calculateAdx(validCandles);
  const supertrend = calculateSupertrend(validCandles);

  const latest = validCandles.at(-1);
  const latestSession = nseDateAndMinutes(latest.timestamp);
  const currentSessionCandles = validCandles.filter(
    (candle) => nseDateAndMinutes(candle.timestamp).date === latestSession.date,
  );
  const sessionVolume = currentSessionCandles.reduce((sum, candle) => sum + candle.volume, 0);
  const vwap = sessionVolume > 0
    ? currentSessionCandles.reduce(
      (sum, candle) => sum + (((candle.high + candle.low + candle.close) / 3) * candle.volume),
      0,
    ) / sessionVolume
    : null;
  const currentBucket = latestSession.minutes - (9 * 60 + 15);
  const previousSessionVolumes = new Map();
  for (const candle of validCandles) {
    const local = nseDateAndMinutes(candle.timestamp);
    if (local.date === latestSession.date || local.minutes - (9 * 60 + 15) !== currentBucket) continue;
    previousSessionVolumes.set(local.date, candle.volume);
  }
  const volumeSamples = [...previousSessionVolumes.values()].filter((volume) => volume > 0);
  const avgComparableVolume = volumeSamples.length
    ? volumeSamples.reduce((sum, volume) => sum + volume, 0) / volumeSamples.length
    : null;
  const relativeVolume = avgComparableVolume && avgComparableVolume > 0
    ? latest.volume / avgComparableVolume
    : null;
  const recentCandles = currentSessionCandles.slice(-12);
  const recentHigh = Math.max(...recentCandles.map((candle) => candle.high));
  const recentLow = Math.min(...recentCandles.map((candle) => candle.low));
  const sideways = recentCandles.length >= 6
    && (adx === null || adx < 20 || ((recentHigh - recentLow) / latest.close) < 0.0025);

  const recentRsi = rsiSeries.slice(-14).filter((value) => value !== null);
  const rsiMin = recentRsi.length ? Math.min(...recentRsi) : null;
  const rsiMax = recentRsi.length ? Math.max(...recentRsi) : null;
  const stochasticRsi = rsi !== null && rsiMin !== null && rsiMax !== null && rsiMax > rsiMin
    ? ((rsi - rsiMin) / (rsiMax - rsiMin)) * 100
    : null;

  return {
    ready: true,
    candleCount: validCandles.length,
    lastPrice: latest.close,
    lastCandleTime: latest.timestamp,
    sessionDate: latestSession.date,
    vwap,
    ema9,
    ema20,
    ema50,
    ema200,
    rsi,
    macd,
    macdSignal,
    macdBullish: macd !== null && macdSignal !== null ? macd > macdSignal : null,
    stochasticRsi,
    adx,
    supertrend: supertrend?.value ?? null,
    supertrendDirection: supertrend?.direction ?? null,
    latestVolume: latest.volume,
    avgComparableVolume,
    relativeVolume,
    volumeAboveAverage: relativeVolume !== null ? relativeVolume > 1 : null,
    sideways,
    trend: ema9 !== null && ema20 !== null && ema50 !== null
      ? ema9 > ema20 && ema20 > ema50 ? 'Bullish'
        : ema9 < ema20 && ema20 < ema50 ? 'Bearish'
          : 'Mixed'
      : 'Insufficient history',
  };
}

export function evaluateTechnicalSetup(indicators = {}, { marketOpen = false, dataFresh = true } = {}) {
  if (!indicators.ready) return { setup: 'Insufficient candle data', reasons: [indicators.reason ?? 'Candle data unavailable.'] };
  const required = [
    ['vwap', 'VWAP (requires non-zero traded volume)'],
    ['ema9', 'EMA 9'],
    ['ema20', 'EMA 20'],
    ['rsi', 'RSI'],
    ['macdBullish', 'MACD'],
    ['volumeAboveAverage', 'relative-volume baseline'],
    ['adx', 'ADX'],
  ];
  const missing = required.filter(([field]) => indicators[field] == null).map(([, label]) => label);
  if (missing.length) {
    return { setup: 'Cannot assess technical setup', reasons: [`Unavailable: ${missing.join(', ')}.`] };
  }
  if (!marketOpen) return { setup: 'Market closed · showing previous session', reasons: [] };
  if (!dataFresh) return { setup: 'Stale candles · no current setup', reasons: ['Latest 5-minute candle is more than 15 minutes old.'] };

  const bullish = Number(indicators.lastPrice) > Number(indicators.vwap)
    && Number(indicators.ema9) > Number(indicators.ema20)
    && Number(indicators.rsi) >= 55
    && Number(indicators.rsi) <= 75
    && indicators.macdBullish === true
    && indicators.volumeAboveAverage === true
    && Number(indicators.adx) >= 20
    && indicators.sideways === false;
  const bearish = Number(indicators.lastPrice) < Number(indicators.vwap)
    && Number(indicators.ema9) < Number(indicators.ema20)
    && Number(indicators.rsi) >= 25
    && Number(indicators.rsi) <= 45
    && indicators.macdBullish === false
    && indicators.volumeAboveAverage === true
    && Number(indicators.adx) >= 20
    && indicators.sideways === false;

  if (bullish) {
    return {
      setup: 'Bullish technical setup · news confirmation required',
      reasons: ['5-minute price, trend, momentum, ADX and relative-volume rules align.'],
    };
  }
  if (bearish) {
    return {
      setup: 'Bearish technical setup · news confirmation required',
      reasons: ['5-minute price, trend, momentum, ADX and relative-volume rules align.'],
    };
  }
  return { setup: 'No technical setup', reasons: ['The available 5-minute technical rules are not fully aligned.'] };
}

const signalFields = [
  ['ltp', 'last price', (value) => Number.isFinite(Number(value)) && Number(value) > 0],
  ['vwap', 'VWAP', (value) => Number.isFinite(Number(value)) && Number(value) > 0],
  ['ema9', 'EMA 9', (value) => Number.isFinite(Number(value)) && Number(value) > 0],
  ['ema20', 'EMA 20', (value) => Number.isFinite(Number(value)) && Number(value) > 0],
  ['rsi', 'RSI', (value) => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100],
  ['macdBullish', 'MACD direction', (value) => typeof value === 'boolean'],
  ['volumeAboveAverage', 'relative volume', (value) => typeof value === 'boolean'],
  ['newsSentiment', 'verified news sentiment', (value) => ['positive', 'neutral', 'negative'].includes(value)],
  ['adx', 'ADX', (value) => Number.isFinite(Number(value)) && Number(value) >= 0],
  ['isSideways', 'market-structure check', (value) => typeof value === 'boolean'],
  ['hasMajorEventRisk', 'event-risk check', (value) => typeof value === 'boolean'],
  ['marketOpen', 'market-session status', (value) => typeof value === 'boolean'],
  ['lastUpdateTime', 'quote timestamp', (value) => typeof value === 'string' && value.length > 0],
];

export function evaluateIntradaySignal(data = {}, { now = Date.now(), maxAgeMs = 5 * 60 * 1000 } = {}) {
  const missingInputs = signalFields
    .filter(([field, , isValid]) => !isValid(data[field]))
    .map(([, label]) => label);

  if (missingInputs.length) {
    return {
      signal: 'Awaiting verified intraday data',
      signalType: 'neutral',
      action: 'HOLD',
      confidence: 0,
      reasons: [`Required data unavailable: ${missingInputs.join(', ')}.`],
      missingInputs,
    };
  }

  const updatedAt = Date.parse(data.lastUpdateTime);
  const ageMs = now - updatedAt;
  if (!Number.isFinite(updatedAt) || ageMs < -60_000 || ageMs > maxAgeMs) {
    return {
      signal: 'Stale or invalid quote',
      signalType: 'neutral',
      action: 'HOLD',
      confidence: 0,
      reasons: ['Quote is invalid or older than five minutes.'],
      missingInputs: [],
    };
  }

  if (!data.marketOpen || !isWithinNseSession(now)) {
    return {
      signal: 'Market closed',
      signalType: 'neutral',
      action: 'HOLD',
      confidence: 0,
      reasons: ['Intraday signals are disabled outside the verified market session.'],
      missingInputs: [],
    };
  }

  const hardRiskReasons = [];
  if (Number(data.adx) < 20) hardRiskReasons.push('ADX is below 20.');
  if (!data.volumeAboveAverage) hardRiskReasons.push('Volume is not above average.');
  if (data.isSideways) hardRiskReasons.push('Sideways market filter is active.');
  if (data.hasMajorEventRisk) hardRiskReasons.push('Major event risk is active.');

  if (hardRiskReasons.length) {
    return {
      signal: 'Risk filter blocked',
      signalType: 'neutral',
      action: 'HOLD',
      confidence: 0,
      reasons: hardRiskReasons,
      missingInputs: [],
    };
  }

  const bullishChecks = [
    [Number(data.ltp) > Number(data.vwap), 'Price is not above VWAP.'],
    [Number(data.ema9) > Number(data.ema20), 'EMA 9 is not above EMA 20.'],
    [Number(data.rsi) >= 55 && Number(data.rsi) <= 75, 'RSI is outside the 55-75 buy range.'],
    [data.macdBullish, 'MACD is not bullish.'],
    [data.volumeAboveAverage, 'Volume is not above average.'],
    [data.newsSentiment === 'positive', 'News sentiment is not positive.'],
  ];
  const bearishChecks = [
    [Number(data.ltp) < Number(data.vwap), 'Price is not below VWAP.'],
    [Number(data.ema9) < Number(data.ema20), 'EMA 9 is not below EMA 20.'],
    [Number(data.rsi) >= 25 && Number(data.rsi) <= 45, 'RSI is outside the 25-45 sell range.'],
    [!data.macdBullish, 'MACD is not bearish.'],
    [data.volumeAboveAverage, 'Volume is not above average.'],
    [data.newsSentiment === 'negative', 'News sentiment is not negative.'],
  ];

  const bullishCount = bullishChecks.filter(([passes]) => passes).length;
  const bearishCount = bearishChecks.filter(([passes]) => passes).length;
  const isBuy = bullishCount === bullishChecks.length;
  const isSell = bearishCount === bearishChecks.length;
  const confidence = Math.round((Math.max(bullishCount, bearishCount) / bullishChecks.length) * 100);

  if (isBuy && confidence >= 75) {
    return { signal: 'BUY setup confirmed', signalType: 'bullish', action: 'BUY', confidence, reasons: [], missingInputs: [] };
  }
  if (isSell && confidence >= 75) {
    return { signal: 'SELL setup confirmed', signalType: 'bearish', action: 'SELL', confidence, reasons: [], missingInputs: [] };
  }

  const reasons = bullishCount >= bearishCount
    ? bullishChecks.filter(([passes]) => !passes).map(([, reason]) => reason)
    : bearishChecks.filter(([passes]) => !passes).map(([, reason]) => reason);

  return {
    signal: 'Rule set incomplete',
    signalType: 'neutral',
    action: 'HOLD',
    confidence,
    reasons,
    missingInputs: [],
  };
}

function evaluatePriceStructure(stock = {}, overrides = {}) {
  const ltp = Number(stock.ltp ?? 0);
  const high = Number(stock.high_price ?? ltp);
  const low = Number(stock.low_price ?? ltp);
  const perChange = Number(stock.perChange ?? 0);
  const recentRange = high > low ? (high - low) / Math.max(ltp, 1) : 0;
  const positionInRange = high > low ? (ltp - low) / (high - low) : 0.5;
  const isCompression = recentRange < 0.04;
  const hasHigherHighHigherLow = Number(stock.hhhl ?? 0) > 0 || Number(stock.hhHL ?? 0) > 0;
  const insideBar = Number(stock.insideBar ?? 0) > 0 || Number(stock.insideBars ?? 0) > 0;
  const nr7 = Number(stock.nr7 ?? 0) > 0 || Number(stock.nr7Pattern ?? 0) > 0;
  const ascendingBase = Number(stock.ascendingBase ?? 0) > 0 || Number(stock.ascBase ?? 0) > 0;
  const multiDayCompression = Number(stock.multiDayCompression ?? 0) > 0;
  const nearResistance = Number(stock.nearResistance ?? 0) > 0 || Number(stock.resistanceGap ?? 0) <= 3;

  let score = 50;
  if (hasHigherHighHigherLow) score += 18;
  if (isCompression) score += 16;
  if (insideBar) score += 12;
  if (nr7) score += 10;
  if (multiDayCompression) score += 12;
  if (ascendingBase) score += 12;
  if (nearResistance) score += 10;
  if (positionInRange > 0.55 && perChange > 0) score += 8;
  if (positionInRange < 0.45 && perChange < 0) score -= 8;

  return clamp(score, 0, 100);
}

function evaluateVolumeFootprint(stock = {}, overrides = {}) {
  const volume = Number(stock.trade_quantity ?? 0);
  const avgVolume = Number(stock.avgVolume ?? (volume || 1));
  const deliveryPercent = Number(stock.deliveryPercent ?? stock.delivery_percentage ?? stock.delivery ?? 50);
  const accumulation = Number(stock.accumulation ?? stock.hiddenAccumulation ?? 0);
  const volumeRatio = avgVolume > 0 ? volume / avgVolume : 1;
  const contraction = Number(stock.volumeContraction ?? 0) > 0;
  const dryVolume = Number(stock.dryVolume ?? 0) > 0;

  let score = 50;
  if (volumeRatio > 1.1) score += 18;
  if (deliveryPercent > 55) score += 12;
  if (accumulation > 0) score += 18;
  if (contraction) score += 8;
  if (dryVolume) score -= 6;
  if (Number(stock.perChange ?? 0) > 0) score += 6;

  return clamp(score, 0, 100);
}

function evaluateVolatilityExpansion(stock = {}, overrides = {}) {
  const perChange = Number(stock.perChange ?? 0);
  const atrCompression = Number(stock.atrCompression ?? stock.atr_contraction ?? 0);
  const squeeze = Number(stock.bollingerSqueeze ?? stock.squeeze ?? 0);
  const volatilityRank = Number(stock.volatilityRank ?? stock.volRank ?? 0);

  let score = 50;
  if (atrCompression > 0) score += 16;
  if (squeeze > 0) score += 18;
  if (volatilityRank > 0) score += 12;
  if (perChange > 0) score += 8;
  if (perChange < 0) score -= 8;

  return clamp(score, 0, 100);
}

function evaluateRelativeStrength(stock = {}) {
  const perChange = Number(stock.perChange ?? 0);
  const sectorStrength = Number(stock.sectorStrength ?? 0);
  const niftyStrength = Number(stock.niftyStrength ?? 0);
  let score = 50 + (perChange * 6) + (sectorStrength * 0.5) + (niftyStrength * 0.5);
  return clamp(score, 0, 100);
}

function evaluateNewsSentiment(stock = {}) {
  const sentiment = Number(stock.newsSentiment ?? stock.sentimentScore ?? 50);
  const promoterBuying = Number(stock.promoterBuying ?? 0) > 0 ? 12 : 0;
  const fiiBuying = Number(stock.fiiBuying ?? 0) > 0 ? 10 : 0;
  const diiBuying = Number(stock.diiBuying ?? 0) > 0 ? 10 : 0;
  const earningsSurprise = Number(stock.earningsSurprise ?? 0) > 0 ? 12 : 0;
  return clamp(sentiment + promoterBuying + fiiBuying + diiBuying + earningsSurprise, 0, 100);
}

export function buildVolatilityAdjustedForecast(currentPrice, context = {}) {
  const price = Number(currentPrice ?? 0);
  const historicalVolatility = Number(context.historicalVolatility ?? 0.8);
  const atrPercent = Number(context.atrPercent ?? 0.75);
  const intradayVolatility = Number(context.intradayVolatility ?? 1.0);
  const marketBreadth = Number(context.marketBreadth ?? 0);
  const relativeStrength = Number(context.relativeStrength ?? 55);
  const volumeProfile = Number(context.volumeProfile ?? 60);
  const vwapPosition = Number(context.vwapPosition ?? 0.5);
  const sectorStrength = Number(context.sectorStrength ?? 55);
  const smartMoneyFlow = Number(context.smartMoneyFlow ?? 60);
  const newsSentiment = Number(context.newsSentiment ?? 58);

  const directionalBias = clamp(
    50 +
      marketBreadth * 0.35 +
      (relativeStrength - 50) * 0.38 +
      (volumeProfile - 50) * 0.42 +
      (smartMoneyFlow - 50) * 0.45 +
      (newsSentiment - 50) * 0.28 +
      (vwapPosition - 0.5) * 20 +
      (sectorStrength - 50) * 0.28,
    20,
    76,
  );

  const bullishProbability = clamp(Math.round(directionalBias), 34, 68);
  const bearishProbability = clamp(Math.round(100 - directionalBias), 32, 66);
  const confidence = clamp(
    Math.round(
      52 +
        Math.abs(bullishProbability - bearishProbability) * 0.4 +
        volumeProfile * 0.12 +
        sectorStrength * 0.08,
    ),
    52,
    80,
  );

  const direction =
    bullishProbability >= 56 && bullishProbability >= bearishProbability + 6
      ? 'Bullish'
      : bearishProbability >= 56 && bearishProbability >= bullishProbability + 6
        ? 'Bearish'
        : 'Neutral';

  const baseMovePercent = clamp(
    (historicalVolatility * 0.18) +
      (atrPercent * 0.22) +
      (intradayVolatility * 0.18) +
      Math.abs(marketBreadth) * 0.025,
    0.18,
    1.2,
  );

  const scenarios = [
    { timeframe: '5M', multiplier: 0.55 },
    { timeframe: '15M', multiplier: 0.82 },
    { timeframe: '30M', multiplier: 1.12 },
    { timeframe: '1H', multiplier: 1.55 },
    { timeframe: '3H', multiplier: 2.2 },
    { timeframe: '1D', multiplier: 3.1 },
  ].map(({ timeframe, multiplier }) => {
    const expectedMovePercent = Number((baseMovePercent * multiplier).toFixed(2));
    const directionFactor = direction === 'Bullish' ? 1 : direction === 'Bearish' ? -1 : 0;
    const mostLikelyPrice = Number((price * (1 + (directionFactor * expectedMovePercent) / 100)).toFixed(2));
    const probability70Range = Number((expectedMovePercent * 0.7).toFixed(2));
    const probability95Range = Number((expectedMovePercent * 1.2).toFixed(2));

    const low70 = Number((mostLikelyPrice * (1 - probability70Range / 100)).toFixed(2));
    const high70 = Number((mostLikelyPrice * (1 + probability70Range / 100)).toFixed(2));
    const low95 = Number((mostLikelyPrice * (1 - probability95Range / 100)).toFixed(2));
    const high95 = Number((mostLikelyPrice * (1 + probability95Range / 100)).toFixed(2));
    const expectedHigh = Number((mostLikelyPrice * (1 + (expectedMovePercent * 0.38) / 100)).toFixed(2));
    const expectedLow = Number((mostLikelyPrice * (1 - (expectedMovePercent * 0.38) / 100)).toFixed(2));
    const support = Number((price * (1 - (expectedMovePercent * 0.45) / 100)).toFixed(2));
    const resistance = Number((price * (1 + (expectedMovePercent * 0.45) / 100)).toFixed(2));
    const timeBias = timeframe === '5M' ? 0 : timeframe === '15M' ? 1 : timeframe === '30M' ? 2 : timeframe === '1H' ? 3 : timeframe === '3H' ? 4 : 5;
    const scenarioBullish = clamp(
      Math.round(
        bullishProbability +
          (direction === 'Bullish' ? 6 : 0) +
          timeBias -
          (timeframe === '5M' ? 8 : 0),
      ),
      35,
      72,
    );
    const scenarioBearish = clamp(
      Math.round(
        bearishProbability +
          (direction === 'Bearish' ? 6 : 0) +
          timeBias -
          (timeframe === '5M' ? 8 : 0),
      ),
      35,
      72,
    );
    const scenarioConfidence = clamp(Math.round(confidence + (timeBias * 1.5) - (timeframe === '5M' ? 12 : 0)), 52, 81);
    const scenarioDirection = scenarioBullish >= scenarioBearish + 4 ? 'Bullish' : scenarioBearish >= scenarioBullish + 4 ? 'Bearish' : 'Neutral';
    const riskLevel = scenarioConfidence >= 70 ? 'Low' : scenarioConfidence >= 60 ? 'Medium' : 'High';

    return {
      timeframe,
      currentPrice: price,
      bullishProbability: scenarioBullish,
      bearishProbability: scenarioBearish,
      confidence: scenarioConfidence,
      expectedDirection: scenarioDirection,
      expectedMovePercent,
      mostLikelyPrice,
      probability70Range: { low: low70, high: high70 },
      probability95Range: { low: low95, high: high95 },
      extremeRange: { low: low95, high: high95 },
      expectedHigh,
      expectedLow,
      support,
      resistance,
      riskLevel,
    };
  });

  return {
    currentPrice: price,
    bullishProbability,
    bearishProbability,
    confidence,
    direction,
    scenarios,
  };
}

function evaluateSmartMoney(stock = {}) {
  const deliveryPercent = Number(stock.deliveryPercent ?? stock.delivery_percentage ?? 50);
  const oiBuildup = Number(stock.oiBuildup ?? stock.oi_buildup ?? 0);
  const blockDeals = Number(stock.blockDeals ?? 0);
  const bulkDeals = Number(stock.bulkDeals ?? 0);
  let score = 50 + (deliveryPercent - 50) * 0.8 + oiBuildup * 2 + (blockDeals > 0 ? 10 : 0) + (bulkDeals > 0 ? 8 : 0);
  return clamp(score, 0, 100);
}

export function buildForwardQuantModel(stock = {}, metrics = {}) {
  const priceStructure = Number(metrics.priceStructure ?? evaluatePriceStructure(stock));
  const volumeFootprint = Number(metrics.volumeFootprint ?? evaluateVolumeFootprint(stock));
  const volatilityExpansion = Number(metrics.volatilityExpansion ?? evaluateVolatilityExpansion(stock));
  const relativeStrength = Number(metrics.relativeStrength ?? evaluateRelativeStrength(stock));
  const newsSentiment = Number(metrics.newsSentiment ?? evaluateNewsSentiment(stock));
  const smartMoney = Number(metrics.smartMoney ?? evaluateSmartMoney(stock));
  const breakoutEngine = Number(metrics.breakoutEngine ?? clamp((priceStructure * 0.45) + (volumeFootprint * 0.25) + (relativeStrength * 0.20) + (newsSentiment * 0.10), 0, 100));
  const breakdownEngine = Number(metrics.breakdownEngine ?? clamp((100 - priceStructure) * 0.45 + (100 - volumeFootprint) * 0.25 + (100 - relativeStrength) * 0.20 + (100 - newsSentiment) * 0.10, 0, 100));
  const sectorMomentum = Number(metrics.sectorMomentum ?? clamp(relativeStrength + 4, 0, 100));
  const liquidityFlow = Number(metrics.liquidityFlow ?? clamp(volumeFootprint * 0.7 + relativeStrength * 0.3, 0, 100));

  const bullishProbability = clamp(
    (breakoutEngine * 0.30) +
    (relativeStrength * 0.20) +
    (smartMoney * 0.15) +
    (volatilityExpansion * 0.15) +
    (priceStructure * 0.10) +
    (newsSentiment * 0.10),
    0,
    100,
  );

  const bearishProbability = clamp(
    (breakdownEngine * 0.30) +
    ((100 - relativeStrength) * 0.20) +
    ((100 - smartMoney) * 0.15) +
    ((100 - volatilityExpansion) * 0.15) +
    ((100 - priceStructure) * 0.10) +
    ((100 - newsSentiment) * 0.10),
    0,
    100,
  );

  const breakoutProbability = clamp(
    (breakoutEngine * 0.50) +
    (volumeFootprint * 0.20) +
    (priceStructure * 0.15) +
    (relativeStrength * 0.15),
    0,
    100,
  );

  const breakdownProbability = clamp(
    (breakdownEngine * 0.50) +
    ((100 - volumeFootprint) * 0.20) +
    ((100 - priceStructure) * 0.15) +
    ((100 - relativeStrength) * 0.15),
    0,
    100,
  );

  const signal = bullishProbability >= bearishProbability && breakoutProbability >= breakdownProbability
    ? 'Early Bullish Setup'
    : bearishProbability > bullishProbability && breakdownProbability >= breakoutProbability
      ? 'Early Bearish Setup'
      : breakoutProbability > breakdownProbability
        ? 'Potential Breakout'
        : 'Neutral';

  const confidence = Math.abs(bullishProbability - bearishProbability) >= 18 && breakoutProbability >= 65
    ? 'High'
    : Math.abs(bullishProbability - bearishProbability) >= 10
      ? 'Medium'
      : 'Low';

  const expectedMove = {
    '1 Day': `${Math.max(0.6, (breakoutProbability - 50) / 18).toFixed(1)}%`,
    '3 Days': `${Math.max(1.5, (bullishProbability - 45) / 12).toFixed(1)}%`,
    '5 Days': `${Math.max(2.4, (breakoutProbability + bullishProbability - 80) / 10).toFixed(1)}%`,
  };

  const keyReasons = [
    `${stock.symbol ?? 'Stock'} is showing ${priceStructure >= 70 ? 'strong structural compression and higher-high / higher-low behavior' : 'moderate price stability'} before the expansion phase.`,
    `Volume footprint is ${volumeFootprint >= 70 ? 'confirming institutional accumulation' : 'mixed but not yet destructive'}, with ${liquidityFlow >= 60 ? 'healthy liquidity flow' : 'limited participation'}.`,
    `Relative strength is ${relativeStrength >= 70 ? 'outperforming the index and sector' : 'neutral to slightly lagging'}, supporting the setup.`,
    `Smart money indicators, including ${smartMoney >= 70 ? 'delivery and OI buildup' : 'mixed actor participation'}, remain constructive for early positioning.`,
    `News sentiment and volatility expansion remain ${newsSentiment >= 60 && volatilityExpansion >= 60 ? 'positive for a pre-breakout move' : 'mixed but watchable'} and are creating the early trigger.`,
  ];

  const aiVerdict = bullishProbability >= bearishProbability
    ? `${stock.symbol ?? 'This stock'} is likely to move before the actual breakout because price structure, relative strength, and smart money are aligning ahead of expansion. This is a classic accumulation phase: compression is being absorbed, volume is improving, and institutional participation is building before the move emerges.`
    : `${stock.symbol ?? 'This stock'} is likely to lose strength before a full breakdown because relative strength is weakening and risk appetite is fading. The setup is being driven by distribution behavior and deteriorating structural support rather than fresh bullish momentum.`;

  return {
    stock: stock.symbol ?? 'NSE Stock',
    currentPrice: Number(stock.ltp ?? stock.currentPrice ?? 0),
    bullishProbability: clamp(Math.round(bullishProbability), 0, 100),
    bearishProbability: clamp(Math.round(bearishProbability), 0, 100),
    breakoutProbability: clamp(Math.round(breakoutProbability), 0, 100),
    breakdownProbability: clamp(Math.round(breakdownProbability), 0, 100),
    signal,
    confidence,
    expectedMove,
    keyReasons,
    aiVerdict,
    metrics: {
      priceStructure,
      volumeFootprint,
      volatilityExpansion,
      relativeStrength,
      newsSentiment,
      smartMoney,
      breakoutEngine,
      breakdownEngine,
      sectorMomentum,
      liquidityFlow,
    },
  };
}

export function buildMarketPulse(gainers = [], losers = [], oiUnderlyings = []) {
  const bullishCount = gainers.filter((s) => Number(s.perChange ?? 0) > 0).length + oiUnderlyings.filter((s) => Number(s.avgInOI ?? 0) > 0).length;
  const bearishCount = losers.filter((s) => Number(s.perChange ?? 0) < 0).length + oiUnderlyings.filter((s) => Number(s.avgInOI ?? 0) < 0).length;
  const totalCount = Math.max(1, bullishCount + bearishCount);

  const strongestGainer = [...gainers].sort((a, b) => Number(b.perChange ?? 0) - Number(a.perChange ?? 0))[0];
  const strongestLoser = [...losers].sort((a, b) => Number(a.perChange ?? 0) - Number(b.perChange ?? 0))[0];
  const strongestOI = [...oiUnderlyings].sort((a, b) => (Number(b.avgInOI ?? b.pChangeInOI ?? 0) - Number(a.avgInOI ?? a.pChangeInOI ?? 0)))[0];

  const avgGainer = gainers.length ? gainers.reduce((sum, stock) => sum + Number(stock.perChange ?? 0), 0) / gainers.length : 0;
  const avgLoser = losers.length ? losers.reduce((sum, stock) => sum + Number(stock.perChange ?? 0), 0) / losers.length : 0;
  const breadth = clamp(((avgGainer - avgLoser) * 12) + (((bullishCount - bearishCount) / totalCount) * 100), -100, 100);

  let regime = 'Balanced';
  let bias = 'Wait for confirmation';
  let confidence = 56;

  if (avgGainer > 1.5 && breadth > 12) {
    regime = 'Strong Bullish';
    bias = 'Risk-on';
    confidence = 84;
  } else if (avgLoser < -1.5 && breadth < -12) {
    regime = 'Strong Bearish';
    bias = 'Risk-off';
    confidence = 83;
  } else if (breadth > 5) {
    regime = 'Bullish';
    bias = 'Momentum build';
    confidence = 72;
  } else if (breadth < -5) {
    regime = 'Bearish';
    bias = 'Weak follow-through';
    confidence = 70;
  } else if (Math.abs(breadth) < 8) {
    if (avgGainer > avgLoser) {
      regime = 'Balanced Bullish';
      bias = 'Selective accumulation';
      confidence = 61;
    } else if (avgLoser > avgGainer) {
      regime = 'Balanced Bearish';
      bias = 'Selective risk-off';
      confidence = 61;
    } else {
      regime = 'Range Bound';
      bias = 'Selective entries';
      confidence = 59;
    }
  }

  return {
    regime,
    breadth: clamp(Math.round(breadth), -100, 100),
    leader: strongestGainer?.symbol ?? strongestOI?.symbol ?? 'Market watch',
    leaderMove: strongestGainer ? Number(strongestGainer.perChange ?? 0) : Number(strongestOI?.avgInOI ?? strongestOI?.pChangeInOI ?? 0),
    bias,
    confidence,
    totalBullish: bullishCount,
    totalBearish: bearishCount,
    strongestGainer,
    strongestLoser,
    strongestOI,
  };
}

export function buildPredictionHistorySummary(records = []) {
  const normalized = (Array.isArray(records) ? records : []).filter((record) => record && typeof record === 'object');

  if (!normalized.length) {
    return {
      totalPredictions: 0,
      todayAccuracy: 0,
      weeklyAccuracy: 0,
      monthlyAccuracy: 0,
      predictionSuccessRate: 0,
      bullishPredictionAccuracy: 0,
      bearishPredictionAccuracy: 0,
      marketAccuracy: {
        Nifty50: 0,
        BankNifty: 0,
        FINNIFTY: 0,
        NiftyIT: 0,
      },
      records: [],
    };
  }

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  const correct = normalized.filter((record) => record.predictionResult === 'Correct').length;
  const partial = normalized.filter((record) => record.predictionResult === 'Partially Correct').length;
  const incorrect = normalized.filter((record) => record.predictionResult === 'Incorrect').length;

  const todayRecords = normalized.filter((record) => record.timestamp && String(record.timestamp).slice(0, 10) === todayKey);
  const weeklyRecords = normalized.filter((record) => record.timestamp && new Date(record.timestamp) >= sevenDaysAgo);
  const monthlyRecords = normalized.filter((record) => record.timestamp && new Date(record.timestamp) >= thirtyDaysAgo);

  const scoreFor = (items = []) => {
    if (!items.length) return 0;
    const itemCorrect = items.filter((record) => record.predictionResult === 'Correct').length;
    const itemPartial = items.filter((record) => record.predictionResult === 'Partially Correct').length;
    return Math.round(((itemCorrect + (itemPartial * 0.5)) / items.length) * 100);
  };

  const strictScoreFor = (items = []) => {
    if (!items.length) return 0;
    const itemCorrect = items.filter((record) => record.predictionResult === 'Correct').length;
    const itemPartial = items.filter((record) => record.predictionResult === 'Partially Correct').length;
    return Math.round(((itemCorrect + itemPartial) / items.length) * 100);
  };

  const marketNames = {
    Nifty50: 'Nifty 50',
    BankNifty: 'Bank Nifty',
    FINNIFTY: 'FINNIFTY',
    NiftyIT: 'Nifty IT',
  };

  const marketAccuracy = Object.fromEntries(Object.entries(marketNames).map(([key, marketName]) => {
    const nameRecords = normalized.filter((record) => record.marketName === marketName);
    const correctRecords = nameRecords.filter((record) => record.predictionResult === 'Correct').length;
    const total = nameRecords.length;
    const score = total ? Math.round((correctRecords / total) * 100) : 0;
    return [key, score];
  }));

  const bullishRecords = normalized.filter((record) => record.predictedDirection === 'Bullish');
  const bearishRecords = normalized.filter((record) => record.predictedDirection === 'Bearish');
  const bullishAccuracyScore = bullishRecords.length
    ? Math.round(((bullishRecords.filter((record) => record.predictionResult === 'Correct').length + bullishRecords.filter((record) => record.predictionResult === 'Partially Correct').length) / normalized.length) * 100)
    : 0;
  const bearishAccuracyScore = bearishRecords.length
    ? Math.round(((bearishRecords.filter((record) => record.predictionResult === 'Correct').length + bearishRecords.filter((record) => record.predictionResult === 'Partially Correct').length) / normalized.length) * 100)
    : 0;

  return {
    totalPredictions: normalized.length,
    todayAccuracy: todayRecords.length ? Math.round((todayRecords.filter((record) => record.predictionResult === 'Correct').length / todayRecords.length) * 100) : 0,
    weeklyAccuracy: scoreFor(weeklyRecords),
    monthlyAccuracy: monthlyRecords.length ? Math.round((correct / monthlyRecords.length) * 100) : 0,
    predictionSuccessRate: strictScoreFor(normalized),
    bullishPredictionAccuracy: bullishAccuracyScore,
    bearishPredictionAccuracy: bearishAccuracyScore,
    marketAccuracy,
    records: normalized,
  };
}

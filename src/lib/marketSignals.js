const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function calculateSignalAndProbability(stock, type, callPutBias) {
  const ltp = Number(stock.ltp ?? 0);
  const high = Number(stock.high_price ?? ltp);
  const low = Number(stock.low_price ?? ltp);
  const yHigh = Number(stock.yearHigh ?? 0);
  const yLow = Number(stock.yearLow ?? 0);
  const change = Number(stock.perChange ?? 0);
  const vol = Number(stock.trade_quantity ?? 0);

  const range = high - low;
  const positionInRange = range > 0 ? (ltp - low) / range : 0.5;
  const positionInYearRange = yHigh && yLow ? (ltp - yLow) / (yHigh - yLow) : 0.5;

  const isNearHigh = positionInRange >= 0.82;
  const isNearLow = positionInRange <= 0.18;
  const isVolSurge = vol > 150000;
  const isStrongMove = Math.abs(change) >= 2.5;
  const isEarlyBull = change > 0.6 && change < 4 && positionInRange > 0.45 && !isNearHigh;
  const isEarlyBear = change < -0.6 && change > -4 && positionInRange < 0.55 && !isNearLow;

  let signal = 'Consolidating';
  let signalType = 'neutral';

  if (yHigh && ltp >= yHigh * 0.985) {
    signal = '52W High Breakout';
    signalType = 'bullish';
  } else if (yLow && ltp <= yLow * 1.015) {
    signal = '52W Low Breakdown';
    signalType = 'bearish';
  } else if (isNearHigh && change > 1.8) {
    signal = isVolSurge ? 'Volume Breakout' : 'Momentum Buy';
    signalType = 'bullish';
  } else if (isNearLow && change < -1.8) {
    signal = isVolSurge ? 'Volume Breakdown' : 'Momentum Sell';
    signalType = 'bearish';
  } else if (isEarlyBull) {
    signal = 'Early Bullish';
    signalType = 'bullish';
  } else if (isEarlyBear) {
    signal = 'Early Bearish';
    signalType = 'bearish';
  } else if (isNearHigh) {
    signal = 'Resistance Test';
    signalType = 'neutral';
  } else if (isNearLow) {
    signal = 'Support Test';
    signalType = 'neutral';
  } else if (change > 0.3) {
    signal = 'Bullish Bias';
    signalType = 'bullish';
  } else if (change < -0.3) {
    signal = 'Bearish Bias';
    signalType = 'bearish';
  }

  let score = 50;
  const changeFactor = Math.min(Math.abs(change) * 3.2, 22);
  score += change >= 0 ? changeFactor : -changeFactor;
  score += (positionInRange - 0.5) * 18;

  if (yHigh && yLow) {
    score += (positionInYearRange - 0.5) * 12;
  }

  if (isStrongMove) score += change > 0 ? 6 : -6;
  if (isEarlyBull) score += 10;
  if (isEarlyBear) score -= 10;
  if (isVolSurge) score += change > 0 ? 8 : -8;

  if (callPutBias === 'CALL SIDE') score += 8;
  else if (callPutBias === 'PUT SIDE') score -= 8;

  if (type === 'gainer' && change <= 0) score -= 5;
  if (type === 'loser' && change >= 0) score += 5;

  score = clamp(score, 8, 96);

  let action = 'HOLD';
  let probability = 50;

  if (score >= 58) {
    action = 'BUY';
    probability = Math.round(score);
  } else if (score <= 42) {
    action = 'SELL';
    probability = Math.round(100 - score);
  } else {
    action = 'HOLD';
    probability = 50;
  }

  return { signal, signalType, action, probability };
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

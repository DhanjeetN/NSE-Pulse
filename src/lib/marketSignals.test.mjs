import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSignalAndProbability,
  buildMarketPulse,
  buildForwardQuantModel,
  buildVolatilityAdjustedForecast,
  buildPredictionHistorySummary,
} from './marketSignals.js';

test('strong bull setup returns BUY with high probability', () => {
  const result = calculateSignalAndProbability({
    symbol: 'RELIANCE',
    ltp: 3010,
    high_price: 3025,
    low_price: 2965,
    yearHigh: 3150,
    yearLow: 2200,
    perChange: 2.8,
    trade_quantity: 250000,
  }, 'gainer', 'CALL SIDE');

  assert.equal(result.action, 'BUY');
  assert.ok(result.probability >= 60);
  assert.equal(result.signalType, 'bullish');
});

test('strong bear setup returns SELL with strong risk-off conviction', () => {
  const result = calculateSignalAndProbability({
    symbol: 'TCS',
    ltp: 3800,
    high_price: 3890,
    low_price: 3825,
    yearHigh: 4200,
    yearLow: 3400,
    perChange: -3.1,
    trade_quantity: 210000,
  }, 'loser', 'PUT SIDE');

  assert.equal(result.action, 'SELL');
  assert.ok(result.probability >= 60);
  assert.equal(result.signalType, 'bearish');
});

test('forward quant model predicts bullish breakout probability before the breakout occurs', () => {
  const model = buildForwardQuantModel({
    symbol: 'INFY',
    ltp: 1520,
    high_price: 1535,
    low_price: 1498,
    perChange: 1.8,
    trade_quantity: 340000,
    yearHigh: 1800,
    yearLow: 1200,
  }, {
    priceStructure: 82,
    volumeFootprint: 78,
    volatilityExpansion: 74,
    relativeStrength: 81,
    newsSentiment: 76,
    smartMoney: 79,
    breakoutEngine: 88,
    breakdownEngine: 26,
    sectorMomentum: 80,
    liquidityFlow: 75,
  });

  assert.ok(model.bullishProbability >= 60);
  assert.ok(model.breakoutProbability >= 68);
  assert.ok(model.bearishProbability < model.bullishProbability);
  assert.match(model.signal, /Bullish|Breakout/);
});

test('institutional compression model identifies a stronger pre-breakout setup', () => {
  const model = buildForwardQuantModel({
    symbol: 'SBIN',
    ltp: 845,
    high_price: 850,
    low_price: 838,
    perChange: 2.4,
    trade_quantity: 420000,
    avgVolume: 270000,
    deliveryPercent: 64,
    oiBuildup: 12,
    newsSentiment: 82,
    sectorStrength: 7,
    niftyStrength: 4,
    atrCompression: 1,
    bollingerSqueeze: 1,
    volatilityRank: 1,
    hhhl: 1,
    insideBar: 1,
    nr7: 1,
    ascendingBase: 1,
    multiDayCompression: 1,
    nearResistance: 1,
  }, {
    priceStructure: 88,
    volumeFootprint: 82,
    volatilityExpansion: 79,
    relativeStrength: 86,
    newsSentiment: 82,
    smartMoney: 84,
    breakoutEngine: 91,
    breakdownEngine: 24,
    sectorMomentum: 84,
    liquidityFlow: 80,
  });

  assert.equal(model.signal, 'Early Bullish Setup');
  assert.ok(model.bullishProbability >= 70);
  assert.ok(model.breakoutProbability >= 80);
  assert.ok(model.aiVerdict.toLowerCase().includes('breakout'));
});

test('market pulse summarises a balanced regime correctly', () => {
  const pulse = buildMarketPulse(
    [{ symbol: 'A', perChange: 2.1 }, { symbol: 'B', perChange: 1.2 }],
    [{ symbol: 'C', perChange: -1.9 }, { symbol: 'D', perChange: -0.7 }],
    [{ symbol: 'X', avgInOI: 1.3 }, { symbol: 'Y', avgInOI: -0.9 }],
  );

  assert.ok(pulse.regime.includes('Bullish') || pulse.regime.includes('Balanced'));
  assert.ok(pulse.breadth > 0);
});

test('historical forecast summary computes actual outcomes from stored prediction records', () => {
  const summary = buildPredictionHistorySummary([
    {
      id: '1',
      timestamp: '2026-10-15T09:30:00.000Z',
      timeframe: '1H',
      marketCondition: 'Bullish',
      bullish: 68,
      bearish: 32,
      confidence: 74,
      predictedDirection: 'Bullish',
      predictedPrice: 24650,
      actualClosingPrice: 24720,
      actualDirection: 'Bullish',
      predictionResult: 'Correct',
      marketName: 'Nifty 50',
    },
    {
      id: '2',
      timestamp: '2026-10-14T09:30:00.000Z',
      timeframe: '15M',
      marketCondition: 'Bearish',
      bullish: 41,
      bearish: 59,
      confidence: 66,
      predictedDirection: 'Bearish',
      predictedPrice: 24580,
      actualClosingPrice: 24620,
      actualDirection: 'Bullish',
      predictionResult: 'Incorrect',
      marketName: 'Bank Nifty',
    },
    {
      id: '3',
      timestamp: '2026-10-13T09:30:00.000Z',
      timeframe: '30M',
      marketCondition: 'Bullish',
      bullish: 56,
      bearish: 44,
      confidence: 58,
      predictedDirection: 'Bullish',
      predictedPrice: 24710,
      actualClosingPrice: 24760,
      actualDirection: 'Bullish',
      predictionResult: 'Partially Correct',
      marketName: 'Nifty 50',
    },
  ]);

  assert.equal(summary.todayAccuracy, 100);
  assert.equal(summary.weeklyAccuracy, 50);
  assert.equal(summary.monthlyAccuracy, 33);
  assert.equal(summary.predictionSuccessRate, 67);
  assert.equal(summary.bullishPredictionAccuracy, 67);
  assert.equal(summary.bearishPredictionAccuracy, 0);
  assert.equal(summary.marketAccuracy.Nifty50, 50);
  assert.equal(summary.marketAccuracy.BankNifty, 0);
  assert.equal(summary.marketAccuracy.NiftyIT, 0);
});

test('volatility-adjusted forecast keeps ranges realistic and monotonic across timeframes', () => {
  const forecast = buildVolatilityAdjustedForecast(24880, {
    historicalVolatility: 0.9,
    atrPercent: 0.8,
    intradayVolatility: 1.2,
    marketBreadth: 14,
    relativeStrength: 68,
    volumeProfile: 72,
    vwapPosition: 0.58,
    sectorStrength: 64,
    smartMoneyFlow: 73,
    newsSentiment: 67,
  });

  assert.ok(forecast.scenarios.length >= 6);
  const ranges = forecast.scenarios.map((scenario) => ({
    label: scenario.timeframe,
    range: scenario.extremeRange.high - scenario.extremeRange.low,
  }));

  for (let index = 1; index < ranges.length; index += 1) {
    assert.ok(ranges[index].range > ranges[index - 1].range, `${ranges[index].label} should be wider than ${ranges[index - 1].label}`);
  }

  assert.ok(forecast.bullishProbability > 50);
  assert.ok(forecast.bearishProbability < forecast.bullishProbability);
  assert.ok(forecast.confidence >= 50);
  assert.ok(forecast.direction === 'Bullish');
  assert.ok(forecast.scenarios[0].expectedMovePercent < 1.2);
  assert.ok(forecast.scenarios[forecast.scenarios.length - 1].expectedMovePercent < 5);
});

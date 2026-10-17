import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateIndexSnapshotBias,
  evaluateIntradaySignal,
  calculateIntradayIndicators,
  evaluateTechnicalSetup,
  buildMarketPulse,
  buildForwardQuantModel,
  buildVolatilityAdjustedForecast,
  buildPredictionHistorySummary,
} from './marketSignals.js';

const signalTime = Date.parse('2026-10-16T10:00:00.000Z');
const validSignalData = {
  ltp: 101,
  vwap: 100,
  ema9: 100.5,
  ema20: 100,
  rsi: 65,
  macdBullish: true,
  volumeAboveAverage: true,
  newsSentiment: 'positive',
  adx: 25,
  isSideways: false,
  hasMajorEventRisk: false,
  marketOpen: true,
  lastUpdateTime: new Date(signalTime).toISOString(),
};

function makeIntradayCandles({ zeroVolume = false } = {}) {
  const firstSession = Date.parse('2026-10-12T03:45:00.000Z') / 1000;
  return Array.from({ length: 80 }, (_, index) => {
    const session = Math.floor(index / 40);
    const slot = index % 40;
    const timestamp = firstSession + session * 24 * 60 * 60 + slot * 5 * 60;
    const close = 100 + index * 0.2;
    return {
      timestamp,
      open: close - 0.1,
      high: close + 0.2,
      low: close - 0.2,
      close,
      volume: zeroVolume ? 0 : index === 79 ? 4000 : 1000,
    };
  });
}

test('5-minute indicator calculation returns current-session VWAP and comparable relative volume', () => {
  const indicators = calculateIntradayIndicators(makeIntradayCandles());

  assert.equal(indicators.ready, true);
  assert.ok(indicators.ema9 > indicators.ema20);
  assert.ok(indicators.ema50 > 0);
  assert.equal(indicators.ema200, null);
  assert.ok(indicators.supertrend > 0);
  assert.equal(indicators.supertrendDirection, 'Bullish');
  assert.ok(indicators.vwap > 0);
  assert.equal(indicators.relativeVolume, 4);
  assert.equal(indicators.volumeAboveAverage, true);
  assert.ok(indicators.adx >= 20);
});

test('zero-volume index candles cannot fabricate VWAP, relative volume, or a technical setup', () => {
  const indicators = calculateIntradayIndicators(makeIntradayCandles({ zeroVolume: true }));
  const setup = evaluateTechnicalSetup(indicators, { marketOpen: true });

  assert.equal(indicators.vwap, null);
  assert.equal(indicators.relativeVolume, null);
  assert.equal(setup.setup, 'Cannot assess technical setup');
  assert.match(setup.reasons[0], /VWAP/);
  assert.match(setup.reasons[0], /relative-volume baseline/);
});

test('stale Yahoo candles cannot be presented as an active setup during market hours', () => {
  const indicators = calculateIntradayIndicators(makeIntradayCandles());
  const setup = evaluateTechnicalSetup(indicators, { marketOpen: true, dataFresh: false });

  assert.equal(setup.setup, 'Stale candles · no current setup');
});

test('closed-market technical setup is clearly labeled as previous-session data', () => {
  const indicators = calculateIntradayIndicators(makeIntradayCandles());
  const setup = evaluateTechnicalSetup(indicators, { marketOpen: false });

  assert.equal(setup.setup, 'Market closed · showing previous session');
});

test('NIFTY 50 snapshot bias is bullish only when price, previous close, and range position align', () => {
  const result = evaluateIndexSnapshotBias({
    currentPrice: 102,
    open: 100,
    high: 103,
    low: 99,
    previousClose: 99.5,
    percentChange: 2.5,
  }, { now: Date.parse('2026-10-16T05:00:00.000Z') });

  assert.equal(result.bias, 'Bullish bias');
  assert.equal(result.marketStatus, 'Market open');
  assert.match(result.reasons[0], /upper part/);
});

test('NIFTY 50 snapshot bias identifies aligned bearish movement', () => {
  const result = evaluateIndexSnapshotBias({
    currentPrice: 98,
    open: 100,
    high: 101,
    low: 97,
    previousClose: 100.5,
    percentChange: -2.5,
  }, { now: Date.parse('2026-10-16T05:00:00.000Z') });

  assert.equal(result.bias, 'Bearish bias');
});

test('mixed NIFTY 50 snapshot never invents a directional bias and closed markets are labeled', () => {
  const result = evaluateIndexSnapshotBias({
    currentPrice: 100,
    open: 99,
    high: 101,
    low: 98,
    previousClose: 100,
    percentChange: 0,
  }, { now: Date.parse('2026-10-17T04:30:00.000Z') });

  assert.equal(result.bias, 'Mixed / no bias');
  assert.equal(result.marketStatus, 'Market closed · last snapshot');
});

test('daily mover data without verified intraday indicators never produces a trade signal', () => {
  const result = evaluateIntradaySignal({
    symbol: 'RELIANCE',
    ltp: 3010,
    perChange: 2.8,
    trade_quantity: 250000,
  }, { now: signalTime });

  assert.equal(result.action, 'HOLD');
  assert.equal(result.confidence, 0);
  assert.ok(result.missingInputs.includes('VWAP'));
  assert.ok(result.missingInputs.includes('verified news sentiment'));
});

test('fully confirmed bullish rules produce a BUY with at least 75% rule match', () => {
  const result = evaluateIntradaySignal(validSignalData, { now: signalTime });

  assert.equal(result.action, 'BUY');
  assert.equal(result.confidence, 100);
  assert.equal(result.signalType, 'bullish');
});

test('fully confirmed bearish rules produce a SELL', () => {
  const result = evaluateIntradaySignal({
    ...validSignalData,
    ltp: 99,
    ema9: 99.5,
    ema20: 100,
    rsi: 35,
    macdBullish: false,
    newsSentiment: 'negative',
  }, { now: signalTime });

  assert.equal(result.action, 'SELL');
  assert.equal(result.confidence, 100);
  assert.equal(result.signalType, 'bearish');
});

test('a rule-match score above 75% is not enough when any required directional rule fails', () => {
  const result = evaluateIntradaySignal({
    ...validSignalData,
    newsSentiment: 'neutral',
  }, { now: signalTime });

  assert.equal(result.action, 'HOLD');
  assert.equal(result.confidence, 83);
  assert.ok(result.reasons.some((reason) => reason.includes('News sentiment')));
});

test('risk filters block otherwise valid setups', async (t) => {
  const blockedInputs = [
    ['ADX below 20', { adx: 19 }],
    ['low volume', { volumeAboveAverage: false }],
    ['sideways market', { isSideways: true }],
    ['major event risk', { hasMajorEventRisk: true }],
    ['market closed', { marketOpen: false }],
    ['stale quote', { lastUpdateTime: new Date(signalTime - 6 * 60 * 1000).toISOString() }],
    ['weekend despite a provider claiming the market is open', {
      marketOpen: true,
      lastUpdateTime: '2026-10-17T04:30:00.000Z',
    }, Date.parse('2026-10-17T04:30:00.000Z')],
  ];

  for (const [name, override, now = signalTime] of blockedInputs) {
    await t.test(name, () => {
      const result = evaluateIntradaySignal(
        { ...validSignalData, ...override },
        { now },
      );
      assert.equal(result.action, 'HOLD');
      assert.equal(result.confidence, 0);
    });
  }
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
  const timestampDaysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const summary = buildPredictionHistorySummary([
    {
      id: '1',
      timestamp: timestampDaysAgo(0),
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
      timestamp: timestampDaysAgo(1),
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
      timestamp: timestampDaysAgo(2),
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

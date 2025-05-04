import mongoose from 'mongoose';
import * as tf from '@tensorflow/tfjs';

import { OrdersModel } from '../model/OrdersModel.js';
import { HoldingsModel } from '../model/HoldingsModel.js';
import { User } from '../model/userModels.js';
import {
  fetchStockData,
  fetchAlphaVantageHistoricalOptions,
  fetchAlphaVantageNewsSentiment,
  demoStockData,
  historicalData,
  riskFactors,
  getCurrentApiProvider,
  alphaVantageCallsToday,
  lastApiReset
} from '../services/stockService.js';

// Create a new order (buy/sell)
export const newOrder = async (req, res) => {
  try {
    const { symbol, qty, mode } = req.body;
    if (!symbol || !qty || !mode) return res.status(400).json({ message: 'Missing order parameters' });
    if (!['buy', 'sell'].includes(mode)) return res.status(400).json({ message: 'Invalid order mode' });

    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    const data = await fetchStockData(symbol);
    if (!data) return res.status(400).json({ message: `No data available for symbol: ${symbol}` });

    const currentPrice = parseFloat(data.price);
    if (isNaN(currentPrice) || currentPrice <= 0) return res.status(400).json({ message: 'Unable to fetch valid stock price' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Buy logic
    if (mode === 'buy') {
      const cost = quantity * currentPrice;
      if (user.balance < cost) return res.status(400).json({ message: 'Insufficient funds' });

      let holding = await HoldingsModel.findOne({ userId: req.user.id, symbol });
      if (holding) {
        const totalCost = holding.quantity * holding.averagePrice + cost;
        const newQuantity = holding.quantity + quantity;
        holding.quantity = newQuantity;
        holding.averagePrice = totalCost / newQuantity;
        await holding.save();
      } else {
        holding = new HoldingsModel({
          userId: req.user.id,
          symbol,
          quantity,
          averagePrice: currentPrice
        });
        await holding.save();
      }

      user.balance -= cost;
      await user.save();
    }
    // Sell logic
    else {
      let holding = await HoldingsModel.findOne({ userId: req.user.id, symbol });
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient holdings to sell' });
      }

      const proceeds = quantity * currentPrice;
      holding.quantity -= quantity;
      if (holding.quantity === 0) await HoldingsModel.deleteOne({ _id: holding._id });
      else await holding.save();

      user.balance += proceeds;
      await user.save();
    }

    const newOrder = new OrdersModel({
      userId: req.user.id,
      symbol,
      qty: quantity,
      price: currentPrice,
      mode,
      date: new Date()
    });
    await newOrder.save();

    res.json({ message: 'Order processed successfully', currentPrice });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch current stock trends
export const getStockTrends = async (req, res) => {
  try {
    const symbols = [
      'IBM','AAPL','MSFT','GOOGL','AMZN',
      'TSLA','NFLX','META','NVDA','ORCL',
      'WMT','HD','JNJ','PFE','BAC'
    ];
    const trendData = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await fetchStockData(symbol);
        if (!data) return null;
        const currentPrice    = parseFloat(data.price);
        const volume          = parseInt(data.volume) || demoStockData[symbol].volume;
        const dayChangePercent= parseFloat(data.percent_change);
        return { symbol, currentPrice, volume, dayChangePercent };
      })
    );
    res.json(trendData.filter(item => item));
  } catch (error) {
    console.error('Stock Trends Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Aggregate trading summary
export const getTradingSummary = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? mongoose.Types.ObjectId(req.user.id)
      : req.user.id;
    let summary = await OrdersModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$mode',
          totalQty: { $sum: '$qty' },
          totalValue: { $sum: { $multiply: ['$qty', '$price'] } },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    if (!summary || summary.length === 0) {
      summary = Object.keys(demoStockData).map(symbol => {
        const totalBuyQty   = Math.floor(Math.random() * 90 + 10);
        const avgBuyPrice   = demoStockData[symbol].price;
        const totalBuyValue = avgBuyPrice * totalBuyQty;
        const totalSellQty  = Math.floor(Math.random() * totalBuyQty);
        const avgSellPrice  = parseFloat((avgBuyPrice * (1 + (Math.random()*0.1 - 0.05))).toFixed(2));
        const totalSellValue= avgSellPrice * totalSellQty;
        const orderCount    = Math.floor(Math.random() * 10 + 1);
        const profit        = totalSellValue - totalBuyValue;
        return { _id: symbol, mode: 'dummy', totalBuyQty, totalBuyValue, totalSellQty, totalSellValue, orderCount, profit, avgBuyPrice, avgSellPrice };
      });
    }
    res.json(summary);
  } catch (error) {
    console.error('Trading Summary Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// List all stocks
export const getAllStocks = async (req, res) => {
  try {
    const symbols = Object.keys(demoStockData);
    const stocks = await Promise.all(
      symbols.map(async symbol => {
        const data = await fetchStockData(symbol);
        return {
          symbol,
          name: symbol,
          price: data
            ? (data.historicalPrices
                ? data.historicalPrices[data.historicalPrices.length-1]
                : data.price)
            : demoStockData[symbol].price,
          volume: data ? data.volume : demoStockData[symbol].volume,
          percent_change: data ? data.percent_change : demoStockData[symbol].percent_change
        };
      })
    );
    res.json(stocks);
  } catch (error) {
    console.error('All Stocks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Team performance mapping
export const getTeamPerformance = async (req, res) => {
  const teamMapping = {
    Gryffindor: 'AAPL', Slytherin: 'TSLA', Hufflepuff: 'MSFT', Ravenclaw: 'GOOGL',
    Durmstrang: 'AMZN', Phoenix: 'NFLX', Shadow: 'META', Mystic: 'NVDA', Titan: 'ORCL', Oracle: 'IBM'
  };

  try {
    const teamsPerformance = await Promise.all(
      Object.entries(teamMapping).map(async ([team, symbol]) => {
        const data = await fetchStockData(symbol);
        const effectiveData = data || demoStockData[symbol];
        if (!effectiveData) throw new Error(`Data not available for ${symbol}`);
        const percentChange = parseFloat(effectiveData.percent_change);
        const volume = effectiveData.volume ? parseFloat(effectiveData.volume) : 1;
        const performance = percentChange * Math.log(volume);
        return { team, symbol, performance: parseFloat(performance.toFixed(2)) };
      })
    );
    res.json(teamsPerformance);
  } catch (error) {
    console.error('Team Performance Error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Option chain for a symbol
export const getOptionChain = async (req, res) => {
  const { symbol } = req.params;
  if (!symbol) return res.status(400).json({ message: 'Stock symbol required' });

  try {
    const data = await fetchStockData(symbol);
    if (!data) return res.status(404).json({ message: `No data available for ${symbol}` });

    const basePrice = parseFloat(data.price);
    if (isNaN(basePrice) || basePrice <= 0) return res.status(400).json({ message: 'Invalid base price for option chain calculation' });

    let optionChain = await fetchAlphaVantageHistoricalOptions(symbol);
    if (!optionChain) {
      const numContracts = 7;
      const lowerBound = basePrice * 0.85;
      const upperBound = basePrice * 1.15;
      const interval   = (upperBound - lowerBound) / (numContracts - 1);

      optionChain = [];
      for (let i = 0; i < numContracts; i++) {
        const strike = Math.round(lowerBound + i * interval);
        const impliedVol = Math.random() * 0.25 + 0.15;
        const premium = parseFloat(((Math.abs(basePrice - strike) * impliedVol * 0.5 + (Math.random()*2))).toFixed(2));
        const openInterest = Math.floor(Math.random()*1900 + 100);
        const attackIntensity = parseFloat(((premium*openInterest*impliedVol)/100000).toFixed(2));
        const expiry = new Date(Date.now() + ((i+1)*30*24*60*60*1000/numContracts)).toISOString().split('T')[0];
        optionChain.push({ strike, expiry, premium, openInterest, attackIntensity });
      }
    }
    res.json({ symbol, optionChain });
  } catch (error) {
    console.error('Option Chain Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Portfolio risk analysis
export const getPortfolioRisk = async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    if (!holdings.length) return res.status(404).json({ message: 'No holdings found' });

    let totalValue = 0;
    let weightedRiskSum = 0;
    for (const holding of holdings) {
      const symbol = holding.symbol;
      if (!symbol || !symbol.trim()) continue;

      let stockData = await fetchStockData(symbol);
      if (!stockData) {
        console.log(`Falling back to dummy data for ${symbol}`);
        stockData = demoStockData[symbol] || { price: holding.averagePrice, volume: 1000000, percent_change: 0 };
      }

      const currentPrice = parseFloat(stockData.price);
      if (isNaN(currentPrice) || currentPrice <= 0) continue;

      const holdingValue = holding.quantity * currentPrice;
      totalValue += holdingValue;

      const riskIndicator = Math.abs(parseFloat(stockData.percent_change));
      const factor = riskFactors[symbol] || 0.5;
      weightedRiskSum += riskIndicator * factor * holdingValue;
    }

    const baselineRisk = totalValue > 0 ? weightedRiskSum / totalValue : 0;
    const trajectory = [parseFloat(baselineRisk.toFixed(3))];
    for (let i = 1; i < 10; i++) {
      trajectory.push(parseFloat((trajectory[i-1] + ((Math.random()-0.5)*0.1)).toFixed(3)));
    }

    res.json({ portfolioRisk: parseFloat(baselineRisk.toFixed(3)), trajectory, totalValue: parseFloat(totalValue.toFixed(2)) });
  } catch (error) {
    console.error('Portfolio Risk Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// TensorFlow.js based holdings predictions
export const getTfHoldingsPredictions = async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    if (!holdings.length) return res.status(404).json({ message: 'No holdings found' });

    const allPredictions = [];
    for (const holding of holdings) {
      const symbol = holding.symbol;
      const data = await fetchStockData(symbol);
      let prices = data && data.historicalPrices
        ? data.historicalPrices.slice()
        : (historicalData[symbol] || [demoStockData[symbol].price]).slice();

      while (prices.length < 30) prices.unshift(prices[0]);
      prices = prices.slice(-30);

      const xs = tf.tensor1d(prices.map((_, i) => i));
      const ys = tf.tensor1d(prices);
      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [1], units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1 }));
      model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

      await model.fit(xs.reshape([-1,1]), ys.reshape([-1,1]), { epochs: 150, verbose: 0 });

      const nextIndex = prices.length;
      const predTensor = model.predict(tf.tensor2d([nextIndex],[1,1]));
      const predictedPrice = predTensor.dataSync()[0];

      const currentPrice = prices[prices.length-1];
      const predictedChange = ((predictedPrice - currentPrice)/currentPrice)*100;
      allPredictions.push({ symbol, currentPrice, predictedPrice, predictedChange });
    }

    allPredictions.sort((a,b) => a.predictedChange - b.predictedChange);
    const sellSymbols = allPredictions.filter(p => p.predictedChange < 0).slice(0,2).map(p => p.symbol);

    const finalPredictions = allPredictions.map(({ symbol, currentPrice, predictedPrice, predictedChange }) => {
      let recommendation = 'Hold';
      let description = `For ${symbol}, current price is $${currentPrice.toFixed(2)}. `;

      if (sellSymbols.includes(symbol)) {
        recommendation = 'Sell Some';
        description += `We expect a ${predictedChange.toFixed(2)}% drop. Consider selling a portion.`;
      } else if (predictedChange > 2) {
        recommendation = 'Buy More';
        description += `Model predicts a strong gain of ${predictedChange.toFixed(2)}%. Consider increasing position.`;
      } else {
        description += `Predicted change of ${predictedChange.toFixed(2)}%. Not severe enough to justify a move. Keep holding.`;
      }

      return {
        symbol,
        predictedPrice: parseFloat(predictedPrice.toFixed(2)),
        predictedChangePercent: parseFloat(predictedChange.toFixed(2)),
        recommendation,
        description
      };
    });

    res.json(finalPredictions);
  } catch (error) {
    console.error('TF Holdings Predictions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// API status and rate-limit info
export const getStatus = (req, res) => {
  const provider = getCurrentApiProvider();
  res.json({
    status: 'operational',
    apiInfo: {
      provider,
      alphaVantageCallsRemaining: 25 - alphaVantageCallsToday,
      resetTime: new Date(lastApiReset + 86400000).toISOString(),
      isMockActive: provider === 'mock'
    },
    serverTime: new Date().toISOString()
  });
};

// Internal VR trading pit data for WebSocket
export const getVRTradingPitData = async () => {
  try {
    const symbols = Object.keys(demoStockData);
    const marketData = await Promise.all(symbols.map(async symbol => {
      const data = await fetchStockData(symbol);
      return { symbol, percent_change: data ? parseFloat(data.percent_change) : demoStockData[symbol].percent_change };
    }));

    const valid = marketData.filter(d => !isNaN(d.percent_change));
    const avgChange = valid.reduce((sum, d) => sum + d.percent_change, 0) / (valid.length || 1);

    const news = await fetchAlphaVantageNewsSentiment();
    let sentimentScore = 0;
    if (news && news.length) {
      const sumScores = news.reduce((sum, art) => art.overall_sentiment_score ? sum + art.overall_sentiment_score : sum, 0);
      sentimentScore = sumScores / news.length;
    }

    let crowdMood = 'neutral', noiseVolume = 40;
    const combined = avgChange + sentimentScore * 5;
    if (combined > 1)      { crowdMood = 'euphoric'; noiseVolume = 80; }
    else if (combined > 0.1){ crowdMood = 'optimistic'; noiseVolume = 60; }
    else if (combined < -1) { crowdMood = 'panic'; noiseVolume = 70; }
    else if (combined < -0.1){ crowdMood = 'concerned'; noiseVolume = 50; }

    const totalVol = symbols.reduce((sum, s) => sum + (demoStockData[s].volume||0),0);
    const avgVol   = totalVol / symbols.length;
    const variance = valid.reduce((acc, d) => acc + Math.pow(d.percent_change - avgChange,2),0) / (valid.length||1);
    const volatility = Math.sqrt(variance);

    return {
      avgPercentChange: parseFloat(avgChange.toFixed(2)),
      crowdMood,
      noiseVolume,
      averageVolume: Math.round(avgVol),
      marketVolatility: parseFloat(volatility.toFixed(2)),
      animationIntensity: Math.min(Math.abs(avgChange)/5,1),
      audioLevel: noiseVolume/100,
      message: `Market avg change is ${avgChange.toFixed(2)}% with volatility ${volatility.toFixed(2)}. Crowd feels ${crowdMood}.`
    };
  } catch (error) {
    console.error('VR Trading Pit Error:', error);
    throw error;
  }
};

// HTTP endpoint wrapping the VR pit data
export const getVrTradingPit = async (req, res) => {
  try {
    const vrData = await getVRTradingPitData();
    res.json(vrData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// backend/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import NodeCache from 'node-cache';
import { createServer } from "http";
import { Server } from "socket.io";
import * as tf from '@tensorflow/tfjs';

import { User } from './model/userModels.js';
import { OrdersModel } from './model/OrdersModel.js';
import { HoldingsModel } from './model/HoldingsModel.js';

const PORT = process.env.PORT || 3000;
const mongoURL = process.env.MONGO_URL;

// Cache for stock data (TTL = 5 minutes)
const stockCache = new NodeCache({ stdTTL: 300 });

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ----------------------------------------------------------------------------
   Demo Data, Historical Data & Risk Factors
   (All U.S. companies now)
----------------------------------------------------------------------------- */
const demoStockData = {
  "IBM":   { price: 130, volume: 3000000, percent_change: 0.5 },
  "AAPL":  { price: 150, volume: 5000000, percent_change: 0.7 },
  "MSFT":  { price: 280, volume: 2000000, percent_change: -0.3 },
  "GOOGL": { price: 2700, volume: 1000000, percent_change: 0.2 },
  "AMZN":  { price: 3400, volume: 1500000, percent_change: -0.1 },
  "TSLA":  { price: 700, volume: 4000000, percent_change: 1.2 },
  "NFLX":  { price: 550, volume: 1800000, percent_change: -0.5 },
  "META":  { price: 330, volume: 2200000, percent_change: 0.8 },
  "NVDA":  { price: 200, volume: 2500000, percent_change: 2.1 },
  "ORCL":  { price: 90, volume: 1500000, percent_change: -0.3 },
  "WMT":   { price: 140, volume: 3000000, percent_change: 0.3 },
  "HD":    { price: 300, volume: 1000000, percent_change: -0.2 },
  "JNJ":   { price: 170, volume: 900000, percent_change: 0.1 },
  "PFE":   { price: 50, volume: 2000000, percent_change: -0.4 },
  "BAC":   { price: 40, volume: 2500000, percent_change: 0.6 },
};

const historicalData = {
  "IBM":   [128, 129, 130, 131, 130],
  "AAPL":  [148, 149, 150, 151, 150],
  "MSFT":  [278, 279, 280, 281, 280],
  "GOOGL": [2690, 2700, 2700, 2710, 2700],
  "AMZN":  [3380, 3390, 3400, 3410, 3400],
  "TSLA":  [680, 690, 700, 710, 700],
  "NFLX":  [545, 547, 550, 553, 550],
  "META":  [325, 327, 330, 332, 330],
  "NVDA":  [195, 197, 200, 202, 200],
  "ORCL":  [88, 89, 90, 91, 90],
  "WMT":   [136, 138, 140, 142, 140],
  "HD":    [295, 298, 300, 305, 300],
  "JNJ":   [168, 169, 170, 171, 170],
  "PFE":   [48, 49, 50, 51, 50],
  "BAC":   [38, 39, 40, 41, 40],
};

const riskFactors = {
  "IBM":   0.3,
  "AAPL":  0.4,
  "MSFT":  0.5,
  "GOOGL": 0.2,
  "AMZN":  0.6,
  "TSLA":  0.8,
  "NFLX":  0.7,
  "META":  0.5,
  "NVDA":  0.9,
  "ORCL":  0.3,
  "WMT":   0.4,
  "HD":    0.5,
  "JNJ":   0.3,
  "PFE":   0.4,
  "BAC":   0.5,
};

/* ----------------------------------------------------------------------------
   API Provider Strategy & Rate Limiting
----------------------------------------------------------------------------- */
const API_PROVIDERS = {
  ALPHA_VANTAGE: 'alphavantage',
  YAHOO_FINANCE: 'yahoofinance',
  MOCK: 'mock'
};

let alphaVantageCallsToday = 0;
let lastApiReset = new Date().setHours(0, 0, 0, 0);

const getCurrentApiProvider = () => {
  const today = new Date().setHours(0, 0, 0, 0);
  if (today > lastApiReset) {
    alphaVantageCallsToday = 0;
    lastApiReset = today;
  }
  if (alphaVantageCallsToday < 20 && process.env.ALPHAVANTAGE_API_KEY) {
    return API_PROVIDERS.ALPHA_VANTAGE;
  }
  if (process.env.YAHOO_FINANCE_API_KEY) {
    return API_PROVIDERS.YAHOO_FINANCE;
  }
  return API_PROVIDERS.MOCK;
};

/* ----------------------------------------------------------------------------
   Helpers to Fetch Various Alpha Vantage Data
----------------------------------------------------------------------------- */
async function fetchAlphaVantageDailyAdjusted(symbol) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}`;
  try {
    alphaVantageCallsToday++;
    const response = await axios.get(url);
    const data = response.data;

    if (!data["Time Series (Daily)"]) {
      return null;
    }

    const dailySeries = data["Time Series (Daily)"];
    const sortedDates = Object.keys(dailySeries).sort(); // oldest to newest
    const last30Dates = sortedDates.slice(-30);
    const dailyCloses = last30Dates.map(d => parseFloat(dailySeries[d]["4. close"]));

    const latestClose = dailyCloses[dailyCloses.length - 1];
    let percentChange = 0;
    if (dailyCloses.length > 1) {
      const prevClose = dailyCloses[dailyCloses.length - 2];
      percentChange = ((latestClose - prevClose) / prevClose) * 100;
    }

    return {
      price: latestClose,
      volume: 0, 
      percent_change: parseFloat(percentChange.toFixed(2)),
      historicalPrices: dailyCloses
    };
  } catch (err) {
    console.error(`Error fetching daily-adjusted data for ${symbol}:`, err.message);
    return null;
  }
}

async function fetchAlphaVantageHistoricalOptions(symbol) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;

  const date = '2017-11-15';
  const url = `https://www.alphavantage.co/query?function=HISTORICAL_OPTIONS&symbol=${symbol}&date=${date}&apikey=${apiKey}`;
  
  try {
    alphaVantageCallsToday++;
    const response = await axios.get(url);
    const data = response.data;

    if (!data || !data.data) {
      return null;
    }

    const chainFromAPI = data.data; 
    const optionChain = chainFromAPI.map(item => {
      const attackIntensity = parseFloat(
        (((item.premium || 0) * (item.openInterest || 0)) / 100000).toFixed(2)
      );
      return {
        strike: item.strike,
        expiry: item.expiry || date,
        premium: item.premium || 0,
        openInterest: item.openInterest || 0,
        attackIntensity
      };
    });

    return optionChain;
  } catch (error) {
    console.error('Alpha Vantage Historical Options Error:', error.message);
    return null;
  }
}

async function fetchAlphaVantageNewsSentiment(tickers = "COIN,CRYPTO:BTC,FOREX:USD") {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return null;

  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickers}&time_from=20220410T0130&limit=1000&apikey=${apiKey}`;
  try {
    alphaVantageCallsToday++;
    const response = await axios.get(url);
    const data = response.data;
    if (!data || !data.feed) {
      return null;
    }
    return data.feed; 
  } catch (err) {
    console.error("Alpha Vantage News & Sentiment Error:", err.message);
    return null;
  }
}

/* ----------------------------------------------------------------------------
   Fetch Alpha Vantage Stock Data (Intraday or Daily Adjusted) with fallback
----------------------------------------------------------------------------- */
const fetchAlphaVantageData = async (symbol) => {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) {
    console.error('Alpha Vantage API key not found');
    return null;
  }

  const dailyAdjustedData = await fetchAlphaVantageDailyAdjusted(symbol);
  if (dailyAdjustedData) {
    return dailyAdjustedData;
  }

  // fallback to 5-min intraday
  try {
    alphaVantageCallsToday++;
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY`
      + `&symbol=${symbol}&interval=5min&outputsize=full&apikey=${apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;

    if (!data["Time Series (5min)"]) {
      console.error(`Missing intraday data for ${symbol}.`);
      return null;
    }

    const timeSeries = data["Time Series (5min)"];
    const allTimestamps = Object.keys(timeSeries).sort();
    if (allTimestamps.length === 0) return null;

    const latestTimestamp = allTimestamps[allTimestamps.length - 1];
    const latestClose = parseFloat(timeSeries[latestTimestamp]["4. close"]);

    const dailyData = {};
    for (const timestamp of allTimestamps) {
      const datePart = timestamp.split(' ')[0];
      if (!dailyData[datePart]) dailyData[datePart] = [];
      dailyData[datePart].push(parseFloat(timeSeries[timestamp]["4. close"]));
    }

    const dates = Object.keys(dailyData).sort();
    const last30Dates = dates.slice(-30);

    const dailyAverages = last30Dates.map(date => {
      const prices = dailyData[date];
      const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      return parseFloat(avg.toFixed(4));
    });

    let percentChange = 0;
    if (dailyAverages.length > 1) {
      const lastAvg = dailyAverages[dailyAverages.length - 1];
      const secondLast = dailyAverages[dailyAverages.length - 2];
      percentChange = ((lastAvg - secondLast) / secondLast) * 100;
    }

    return {
      price: latestClose,
      volume: 0,
      percent_change: parseFloat(percentChange.toFixed(2)),
      historicalPrices: dailyAverages
    };
  } catch (err) {
    console.error(`Error fetching intraday data for ${symbol}:`, err.message);
    return null;
  }
};

/* ----------------------------------------------------------------------------
   Main Stock Data Fetcher with Caching and Fallback
----------------------------------------------------------------------------- */
const fetchStockData = async (symbol) => {
  const cacheKey = `stock_${symbol}`;
  const cachedData = stockCache.get(cacheKey);
  if (cachedData) return cachedData;
  
  const provider = getCurrentApiProvider();
  let stockData = null;

  switch (provider) {
    case API_PROVIDERS.ALPHA_VANTAGE:
      stockData = await fetchAlphaVantageData(symbol);
      break;
    case API_PROVIDERS.YAHOO_FINANCE:
      // If you had a fetchYahooFinanceData, call it here
      console.log(`Yahoo Finance API would be called for ${symbol}`);
      break;
    default:
      stockData = getMockStockData(symbol);
      break;
  }

  if (!stockData) {
    console.log(`Falling back to mock data for ${symbol}`);
    stockData = getMockStockData(symbol);
  }

  if (stockData) {
    stockCache.set(cacheKey, stockData);
  }
  return stockData;
};

/* ----------------------------------------------------------------------------
   Helper: Generate Realistic Mock Data
----------------------------------------------------------------------------- */
const getMockStockData = (symbol) => {
  if (!demoStockData[symbol]) return null;
  const basePrice = demoStockData[symbol].price;
  const variation = (Math.random() * 4 - 2) / 100; // ±2%
  const newPrice = parseFloat((basePrice * (1 + variation)).toFixed(2));
  const prevPrice = historicalData[symbol]
    ? historicalData[symbol][historicalData[symbol].length - 1]
    : basePrice;
  const percentChange = parseFloat(
    (((newPrice - prevPrice) / prevPrice) * 100).toFixed(2)
  );

  if (historicalData[symbol]) {
    historicalData[symbol].shift();
    historicalData[symbol].push(newPrice);
  }

  return {
    price: newPrice,
    volume: Math.floor(
      demoStockData[symbol].volume * (1 + (Math.random() * 0.2 - 0.1))
    ),
    percent_change: percentChange,
    historicalPrices: historicalData[symbol] || []
  };
};

/* ----------------------------------------------------------------------------
   Authentication Middleware
----------------------------------------------------------------------------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

/* ----------------------------------------------------------------------------
   User Endpoints: Signup and Login
----------------------------------------------------------------------------- */
app.post('/api/signup', async (req, res) => {
  const { username, name, email, password } = req.body;
  if (!username || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const newUser = new User({ username, name, email, password });
    await newUser.save();
    console.log(newUser);
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields are required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   Holdings Endpoint
----------------------------------------------------------------------------- */
app.get('/api/holdings', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    res.json(holdings);
  } catch (error) {
    console.error('Holdings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   Positions Endpoint (Uses real-time price from fetchStockData)
----------------------------------------------------------------------------- */
app.get('/api/positions', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });

    const positions = await Promise.all(
      holdings.map(async (holding) => {
        const symbol = holding.symbol;
        if (!symbol || symbol.trim() === "") {
          console.error(`Empty symbol for holding:`, holding);
          return null;
        }
        const data = await fetchStockData(symbol);
        if (!data) {
          console.error(`Could not fetch data for ${symbol}`);
          return null;
        }
        const currentPrice = parseFloat(data.price);
        const dayChangePercent = parseFloat(data.percent_change);

        return {
          symbol,
          companyName: symbol,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentPrice,
          netChange: (currentPrice - holding.averagePrice) * holding.quantity,
          dayChangePercent,
          isLoss: currentPrice < holding.averagePrice
        };
      })
    );

    res.json(positions.filter(pos => pos !== null));
  } catch (error) {
    console.error('Positions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   New Order Endpoint
----------------------------------------------------------------------------- */
app.post('/api/newOrder', authenticateToken, async (req, res) => {
  try {
    const { symbol, qty, mode } = req.body;
    if (!symbol || !qty || !mode) {
      return res.status(400).json({ message: 'Missing order parameters' });
    }
    if (!['buy', 'sell'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid order mode' });
    }

    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const data = await fetchStockData(symbol);
    if (!data) {
      return res.status(400).json({ message: `No data available for symbol: ${symbol}` });
    }

    let currentPrice = parseFloat(data.price);
    if (isNaN(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({ message: 'Unable to fetch valid stock price' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Buy
    if (mode === 'buy') {
      const cost = quantity * currentPrice;
      if (user.balance < cost) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }
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
    // Sell
    else if (mode === 'sell') {
      let holding = await HoldingsModel.findOne({ userId: req.user.id, symbol });
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient holdings to sell' });
      }
      const proceeds = quantity * currentPrice;
      holding.quantity -= quantity;
      if (holding.quantity === 0) {
        await HoldingsModel.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
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

    res.json({ message: "Order processed successfully", currentPrice });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   Stock Trends Endpoint
----------------------------------------------------------------------------- */
app.get('/api/stock-trends', async (req, res) => {
  try {
    // Updated to American symbols only
    const symbols = [
      "IBM", "AAPL", "MSFT", "GOOGL", "AMZN",
      "TSLA", "NFLX", "META", "NVDA", "ORCL",
      "WMT", "HD", "JNJ", "PFE", "BAC"
    ];
    const trendData = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await fetchStockData(symbol);
        if (!data) return null;

        const currentPrice = parseFloat(data.price);
        const volume = parseInt(data.volume) || demoStockData[symbol].volume;
        const dayChangePercent = parseFloat(data.percent_change);

        return {
          symbol,
          currentPrice,
          volume,
          dayChangePercent
        };
      })
    );
    res.json(trendData.filter(item => item !== null));
  } catch (error) {
    console.error('Stock Trends Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   Trading Summary Endpoint
----------------------------------------------------------------------------- */
app.get('/api/trading-summary', authenticateToken, async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? mongoose.Types.ObjectId(req.user.id)
      : req.user.id;
    
    let summary = await OrdersModel.aggregate([
      { $match: { userId } },
      { 
        $group: { 
          _id: "$mode", 
          totalQty: { $sum: "$qty" }, 
          totalValue: { $sum: { $multiply: ["$qty", "$price"] } },
          orderCount: { $sum: 1 }
        } 
      }
    ]);
    
    // If no actual summary in DB, fallback to dummy data
    if (!summary || summary.length === 0) {
      summary = Object.keys(demoStockData).map(symbol => {
        const totalBuyQty = Math.floor(Math.random() * 90 + 10);
        const avgBuyPrice = demoStockData[symbol].price;
        const totalBuyValue = avgBuyPrice * totalBuyQty;
        const totalSellQty = Math.floor(Math.random() * totalBuyQty);
        const avgSellPrice = parseFloat(
          (avgBuyPrice * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2)
        );
        const totalSellValue = avgSellPrice * totalSellQty;
        const orderCount = Math.floor(Math.random() * 10 + 1);
        const profit = totalSellValue - totalBuyValue;
        return {
          _id: symbol,
          mode: "dummy",
          totalBuyQty,
          totalBuyValue,
          totalSellQty,
          totalSellValue,
          orderCount,
          profit,
          avgBuyPrice,
          avgSellPrice
        };
      });
    }
    res.json(summary);
  } catch (error) {
    console.error('Trading Summary Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   All Available Stocks Endpoint
----------------------------------------------------------------------------- */
app.get('/api/all-stocks', async (req, res) => {
  try {
    const symbols = Object.keys(demoStockData);
    const stocks = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await fetchStockData(symbol);
        return {
          symbol,
          name: symbol,
          price: data
            ? (data.historicalPrices
                ? data.historicalPrices[data.historicalPrices.length - 1]
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
});

/* ----------------------------------------------------------------------------
   Team Performance Endpoint
   Updated to reference only U.S. symbols
----------------------------------------------------------------------------- */
app.get('/api/team-performance', async (req, res) => {
  // Example “teams” mapped to specific U.S. stocks
  const teamMapping = {
    "Gryffindor":  "AAPL",
    "Slytherin":   "TSLA",
    "Hufflepuff":  "MSFT",
    "Ravenclaw":   "GOOGL",
    "Durmstrang":  "AMZN",
    "Phoenix":     "NFLX",
    "Shadow":      "META",
    "Mystic":      "NVDA",
    "Titan":       "ORCL",
    "Oracle":      "IBM",
  };

  try {
    const teamsPerformance = await Promise.all(
      Object.entries(teamMapping).map(async ([team, symbol]) => {
        const data = await fetchStockData(symbol);
        const effectiveData = data || demoStockData[symbol];
        if (!effectiveData) throw new Error(`Data not available for ${symbol}`);
        const percentChange = parseFloat(effectiveData.percent_change);
        const volume = effectiveData.volume ? parseFloat(effectiveData.volume) : 1;
        const performanceScore = percentChange * Math.log(volume);
        return {
          team,
          symbol,
          performance: parseFloat(performanceScore.toFixed(2))
        };
      })
    );
    res.json(teamsPerformance);
  } catch (error) {
    console.error('Team Performance Error:', error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

/* ----------------------------------------------------------------------------
   Option Chain Endpoint
----------------------------------------------------------------------------- */
app.get('/api/option-chain/:symbol', async (req, res) => {
  const { symbol } = req.params;
  if (!symbol) return res.status(400).json({ message: 'Stock symbol required' });
  
  try {
    const data = await fetchStockData(symbol);
    if (!data) return res.status(404).json({ message: `No data available for ${symbol}` });

    const basePrice = parseFloat(data.price);
    if (isNaN(basePrice) || basePrice <= 0) {
      return res.status(400).json({ message: 'Invalid base price for option chain calculation' });
    }

    let optionChain = await fetchAlphaVantageHistoricalOptions(symbol);

    if (!optionChain) {
      const numContracts = 7;
      const lowerBound = basePrice * 0.85;
      const upperBound = basePrice * 1.15;
      const interval = (upperBound - lowerBound) / (numContracts - 1);

      optionChain = [];
      for (let i = 0; i < numContracts; i++) {
        const strike = Math.round(lowerBound + i * interval);
        const impliedVol = Math.random() * 0.25 + 0.15;
        const premium = parseFloat(
          (Math.abs(basePrice - strike) * impliedVol * 0.5 + (Math.random() * 2)).toFixed(2)
        );
        const openInterest = Math.floor(Math.random() * 1900 + 100);
        const attackIntensity = parseFloat(
          ((premium * openInterest * impliedVol) / 100000).toFixed(2)
        );
        const expiry = new Date(
          Date.now() + ((i + 1) * 30 * 24 * 60 * 60 * 1000 / numContracts)
        ).toISOString().split('T')[0];
        
        optionChain.push({
          strike,
          expiry,
          premium,
          openInterest,
          attackIntensity
        });
      }
    }

    res.json({ symbol, optionChain });
  } catch (error) {
    console.error('Option Chain Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   Portfolio Risk Analysis Endpoint
----------------------------------------------------------------------------- */
app.get('/api/portfolio-risk', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    if (!holdings.length) return res.status(404).json({ message: 'No holdings found' });

    let totalValue = 0;
    let weightedRiskSum = 0;
    
    for (const holding of holdings) {
      const symbol = holding.symbol;
      if (!symbol || symbol.trim() === "") continue;

      let stockData = await fetchStockData(symbol);
      if (!stockData) {
        console.log(`Falling back to dummy data for ${symbol}`);
        stockData = demoStockData[symbol] || {
          price: holding.averagePrice,
          volume: 1000000,
          percent_change: 0
        };
      }

      const currentPrice = parseFloat(stockData.price);
      if (isNaN(currentPrice) || currentPrice <= 0) continue;

      const holdingValue = holding.quantity * currentPrice;
      totalValue += holdingValue;

      const riskIndicator = Math.abs(parseFloat(stockData.percent_change));
      const riskFactor = riskFactors[symbol] || 0.5;
      weightedRiskSum += riskIndicator * riskFactor * holdingValue;
    }

    const baselineRisk = totalValue > 0 ? weightedRiskSum / totalValue : 0;
    const trajectory = [parseFloat(baselineRisk.toFixed(3))];
    for (let i = 1; i < 10; i++) {
      const change = (Math.random() - 0.5) * 0.1;
      trajectory.push(parseFloat((trajectory[i - 1] + change).toFixed(3)));
    }

    res.json({
      portfolioRisk: parseFloat(baselineRisk.toFixed(3)),
      trajectory,
      totalValue: parseFloat(totalValue.toFixed(2))
    });
  } catch (error) {
    console.error('Portfolio Risk Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   Predictions Endpoint using TensorFlow.js for Holdings
----------------------------------------------------------------------------- */
app.get('/api/tf-holdings-predictions', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    if (!holdings.length) {
      return res.status(404).json({ message: 'No holdings found' });
    }

    const allPredictions = [];
    for (const holding of holdings) {
      const symbol = holding.symbol;
      let data = await fetchAlphaVantageData(symbol);

      let dailyPrices = [];
      if (data && data.historicalPrices) {
        dailyPrices = data.historicalPrices;
      } else {
        dailyPrices = historicalData[symbol] || [demoStockData[symbol].price];
      }

      while (dailyPrices.length < 10) {
        dailyPrices.unshift(dailyPrices[0]);
      }

      const prices = dailyPrices.slice(-30);

      const xs = tf.tensor1d(prices.map((_, i) => i));
      const ys = tf.tensor1d(prices);

      const model = tf.sequential();
      model.add(tf.layers.dense({ inputShape: [1], units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1 }));
      model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

      await model.fit(xs.reshape([-1, 1]), ys.reshape([-1, 1]), {
        epochs: 150,
        verbose: 0
      });

      const nextIndex = prices.length;
      const predictionTensor = model.predict(tf.tensor2d([nextIndex], [1, 1]));
      const predictedPrice = predictionTensor.dataSync()[0];

      const currentPrice = prices[prices.length - 1];
      const predictedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;

      allPredictions.push({
        symbol,
        currentPrice,
        predictedPrice,
        predictedChange
      });
    }

    allPredictions.sort((a, b) => a.predictedChange - b.predictedChange);
    const sellCandidates = allPredictions.filter(p => p.predictedChange < 0);
    const toSell = sellCandidates.slice(0, 2);
    const sellSymbols = toSell.map(p => p.symbol);

    const finalPredictions = allPredictions.map((p) => {
      const { symbol, currentPrice, predictedPrice, predictedChange } = p;
      let recommendation = "Hold";
      let description = `For ${symbol}, current price is $${currentPrice.toFixed(2)}. `;

      if (sellSymbols.includes(symbol)) {
        recommendation = "Sell Some";
        description += `We expect a ${predictedChange.toFixed(2)}% drop. Consider selling a portion.`;
      } else if (predictedChange > 2) {
        recommendation = "Buy More";
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
});

/* ----------------------------------------------------------------------------
   API Status Endpoint
----------------------------------------------------------------------------- */
app.get('/api/status', (req, res) => {
  const currentProvider = getCurrentApiProvider();
  const apiLimitInfo = {
    provider: currentProvider,
    alphaVantageCallsRemaining: 25 - alphaVantageCallsToday,
    resetTime: new Date(lastApiReset + 86400000).toISOString(),
    isMockActive: currentProvider === API_PROVIDERS.MOCK
  };
  
  res.json({
    status: 'operational',
    apiInfo: apiLimitInfo,
    serverTime: new Date().toISOString()
  });
});

/* ----------------------------------------------------------------------------
   VR Trading Pit Logic with integrated NEWS_SENTIMENT
----------------------------------------------------------------------------- */
async function getVRTradingPitData() {
  try {
    const symbols = Object.keys(demoStockData);
    const marketData = await Promise.all(symbols.map(async (symbol) => {
      const data = await fetchStockData(symbol);
      return {
        symbol,
        percent_change: data
          ? parseFloat(data.percent_change)
          : demoStockData[symbol].percent_change
      };
    }));

    const validData = marketData.filter(
      item => item.percent_change !== null && !isNaN(item.percent_change)
    );
    const totalPercentChange = validData.reduce(
      (sum, item) => sum + item.percent_change, 0
    );
    const avgPercentChange = totalPercentChange / (validData.length || 1);

    let newsSentiment = await fetchAlphaVantageNewsSentiment();
    let sentimentScore = 0;
    if (newsSentiment && newsSentiment.length > 0) {
      let sumScore = 0, count = 0;
      for (const article of newsSentiment) {
        if (article.overall_sentiment_score) {
          sumScore += article.overall_sentiment_score;
          count++;
        }
      }
      sentimentScore = count > 0 ? (sumScore / count) : 0;
    }

    let crowdMood = "neutral";
    let noiseVolume = 40;
    const combinedFactor = avgPercentChange + sentimentScore * 5;

    if (combinedFactor > 1) {
      crowdMood = "euphoric";
      noiseVolume = 80;
    } else if (combinedFactor > 0.1) {
      crowdMood = "optimistic";
      noiseVolume = 60;
    } else if (combinedFactor < -1) {
      crowdMood = "panic";
      noiseVolume = 70;
    } else if (combinedFactor < -0.1) {
      crowdMood = "concerned";
      noiseVolume = 50;
    }

    const totalVolume = symbols.reduce((sum, symbol) => 
      sum + (demoStockData[symbol].volume || 0), 0
    );
    const averageVolume = totalVolume / symbols.length;

    const mean = avgPercentChange;
    const variance = validData.reduce(
      (acc, item) => acc + Math.pow(item.percent_change - mean, 2), 0
    ) / (validData.length || 1);
    const marketVolatility = Math.sqrt(variance);
    const animationIntensity = Math.min(Math.abs(avgPercentChange) / 5, 1);
    const audioLevel = noiseVolume / 100;

    return {
      avgPercentChange: parseFloat(avgPercentChange.toFixed(2)),
      crowdMood,
      noiseVolume,
      averageVolume: Math.round(averageVolume),
      marketVolatility: parseFloat(marketVolatility.toFixed(2)),
      animationIntensity,
      audioLevel,
      message: `Market avg change is ${avgPercentChange.toFixed(2)}% with volatility ${marketVolatility.toFixed(2)}. Crowd feels ${crowdMood}.`
    };
  } catch (error) {
    console.error("VR Trading Pit Error:", error);
    throw error;
  }
}

app.get('/api/vr-trading-pit', async (req, res) => {
  try {
    const vrData = await getVRTradingPitData();
    res.json(vrData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* ----------------------------------------------------------------------------
   WebSocket Integration for VR Trading Pit
----------------------------------------------------------------------------- */
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
setInterval(async () => {
  try {
    const vrData = await getVRTradingPitData();
    io.emit("vrData", vrData);
  } catch (error) {
    console.error("Error emitting VR Trading Pit data:", error);
  }
}, 30000);

/* ----------------------------------------------------------------------------
   Start Server & Connect to MongoDB
----------------------------------------------------------------------------- */
const startServer = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log("Connected to MongoDB");
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Using ${getCurrentApiProvider()} as the initial data provider`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

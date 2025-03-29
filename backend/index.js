import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import NodeCache from 'node-cache'; // Add this package via npm install node-cache

import { User } from './model/userModels.js';
import { OrdersModel } from './model/OrdersModel.js';
import { HoldingsModel } from './model/HoldingsModel.js';

const PORT = process.env.PORT || 3000;
const mongoURL = process.env.MONGO_URL;

// Cache for stock data to reduce API calls
const stockCache = new NodeCache({ stdTTL: 300 }); // 5 minute TTL

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- Demo Data for Fallback ----------
const demoStockData = {
  "RELIANCE": { price: 2400, volume: 20000, percent_change: 0.5 },
  "TCS": { price: 3500, volume: 15000, percent_change: 0.7 },
  "INFY": { price: 1500, volume: 25000, percent_change: -0.3 },
  "HDFC": { price: 3000, volume: 12000, percent_change: 0.2 },
  "ICICIBANK": { price: 650, volume: 30000, percent_change: -0.1 }
};

// Add more realistic historical data for trends
const historicalData = {
  "RELIANCE": [2350, 2380, 2400, 2420, 2400],
  "TCS": [3450, 3470, 3500, 3520, 3500],
  "INFY": [1520, 1510, 1500, 1490, 1500],
  "HDFC": [2980, 2990, 3000, 3010, 3000],
  "ICICIBANK": [655, 652, 650, 648, 650]
};

// ---------- Risk Factors for Portfolio Analysis ----------
const riskFactors = {
  "RELIANCE": 0.3,
  "TCS": 0.4,
  "INFY": 0.5,
  "HDFC": 0.2,
  "ICICIBANK": 0.6
};

// ---------- API Provider Strategy ----------
// Multiple stock API providers to fallback on in case of rate limits
const API_PROVIDERS = {
  ALPHA_VANTAGE: 'alphavantage',
  YAHOO_FINANCE: 'yahoofinance',
  MOCK: 'mock'  // Our local fallback
};

// Track API rate limiting
let alphaVantageCallsToday = 0;
let lastApiReset = new Date().setHours(0, 0, 0, 0);

// ---------- Helper: Get Current API Provider ----------
const getCurrentApiProvider = () => {
  // Reset counter at the beginning of a new day
  const today = new Date().setHours(0, 0, 0, 0);
  if (today > lastApiReset) {
    alphaVantageCallsToday = 0;
    lastApiReset = today;
  }

  // Check if Alpha Vantage has calls remaining (limit is 25 for free tier)
  if (alphaVantageCallsToday < 20 && process.env.ALPHAVANTAGE_API_KEY) {
    return API_PROVIDERS.ALPHA_VANTAGE;
  }
  
  // Add Yahoo Finance API check here if you set it up
  if (process.env.YAHOO_FINANCE_API_KEY) {
    return API_PROVIDERS.YAHOO_FINANCE;
  }
  
  // Fallback to mock data
  return API_PROVIDERS.MOCK;
};

// ---------- Helper: Generate Realistic Mock Data ----------
const getMockStockData = (symbol) => {
  if (!demoStockData[symbol]) {
    return null;
  }
  
  const basePrice = demoStockData[symbol].price;
  // Create slight variation (±2%) for realistic mock
  const variation = (Math.random() * 4 - 2) / 100;
  const newPrice = parseFloat((basePrice * (1 + variation)).toFixed(2));
  
  // Calculate percent change
  const prevPrice = historicalData[symbol] ? historicalData[symbol][historicalData[symbol].length - 1] : basePrice;
  const percentChange = parseFloat(((newPrice - prevPrice) / prevPrice * 100).toFixed(2));
  
  // Update historical data (shift array and add new price)
  if (historicalData[symbol]) {
    historicalData[symbol].shift();
    historicalData[symbol].push(newPrice);
  }
  
  return {
    price: newPrice,
    volume: Math.floor(demoStockData[symbol].volume * (1 + (Math.random() * 0.2 - 0.1))),
    percent_change: percentChange
  };
};

// ---------- Helper: Fetch Alpha Vantage Stock Data ----------
const fetchAlphaVantageData = async (symbol) => {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) {
    console.error('Alpha Vantage API key not found');
    return null;
  }
  
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;
  try {
    alphaVantageCallsToday++;
    const response = await axios.get(url);
    const data = response.data;
    
    // Check for rate limit message
    if (data.Information && data.Information.includes('rate limit')) {
      console.warn('Alpha Vantage rate limit reached:', data.Information);
      return null;
    }
    
    if (!data["Time Series (5min)"]) {
      console.error(`Missing time series data for ${symbol}:`, data);
      return null;
    }
    
    const timeSeries = data["Time Series (5min)"];
    const timestamps = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
    if (timestamps.length === 0) return null;
    
    const latest = timeSeries[timestamps[0]];
    const price = parseFloat(latest["4. close"]);
    const open = parseFloat(latest["1. open"]);
    const volume = parseInt(latest["5. volume"]);
    const percentChange = parseFloat(((price - open) / open * 100).toFixed(2));
    
    return {
      price,
      volume,
      percent_change: percentChange
    };
  } catch (err) {
    console.error(`Error fetching Alpha Vantage data for ${symbol}:`, err.message);
    return null;
  }
};

// ---------- Helper: Fetch Yahoo Finance Stock Data ----------
// This is a placeholder - you would need to implement the actual Yahoo Finance API
const fetchYahooFinanceData = async (symbol) => {
  // This would be implemented using the Yahoo Finance API
  // For now, return null to fallback to mock data
  console.log(`Yahoo Finance API would be called for ${symbol}`);
  return null;
};

// ---------- Main Stock Data Fetcher with Caching and Fallbacks ----------
const fetchStockData = async (symbol) => {
  // Check cache first
  const cacheKey = `stock_${symbol}`;
  const cachedData = stockCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Determine which API provider to use
  const provider = getCurrentApiProvider();
  let stockData = null;
  
  switch (provider) {
    case API_PROVIDERS.ALPHA_VANTAGE:
      stockData = await fetchAlphaVantageData(symbol);
      break;
    case API_PROVIDERS.YAHOO_FINANCE:
      stockData = await fetchYahooFinanceData(symbol);
      break;
    default:
      // Fallback to mock data
      stockData = getMockStockData(symbol);
      break;
  }
  
  // If external APIs failed, fallback to mock data
  if (!stockData) {
    console.log(`Falling back to mock data for ${symbol}`);
    stockData = getMockStockData(symbol);
  }
  
  // Save to cache if we have data
  if (stockData) {
    stockCache.set(cacheKey, stockData);
  }
  
  return stockData;
};

// ---------- Authentication Middleware ----------
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

// ---------- Signup Endpoint (Auto-Login) ----------
app.post('/api/signup', async (req, res) => {
  const { username, name, email, password } = req.body;
  if (!username || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ username, name, email, password });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Login Endpoint ----------
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

// ---------- Holdings Endpoint ----------
app.get('/api/holdings', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    res.json(holdings);
  } catch (error) {
    console.error('Holdings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Positions Endpoint ----------
app.get('/api/positions', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    const positions = await Promise.all(holdings.map(async (holding) => {
      const symbol = holding.symbol;
      if (!symbol || symbol.trim() === "") {
        console.error(`Empty symbol for holding:`, holding);
        return null;
      }
      
      const data = await fetchStockData(symbol);
      if (!data) {
        console.error(`Could not fetch any data for ${symbol}`);
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
    }));
    
    res.json(positions.filter(pos => pos !== null));
  } catch (error) {
    console.error('Positions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- New Order Endpoint ----------
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
    
    const currentPrice = parseFloat(data.price);
    if (isNaN(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({ message: 'Unable to fetch valid stock price' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
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
    } else if (mode === 'sell') {
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

// ---------- Stock Trends Endpoint ----------
app.get('/api/stock-trends', async (req, res) => {
  try {
    const symbols = ["RELIANCE", "TCS", "INFY", "HDFC", "ICICIBANK"];
    const trendData = await Promise.all(symbols.map(async (symbol) => {
      const data = await fetchStockData(symbol);
      if (!data) return null;
      
      return { 
        symbol, 
        currentPrice: parseFloat(data.price), 
        volume: parseInt(data.volume) || 0, 
        dayChangePercent: parseFloat(data.percent_change) 
      };
    }));
    
    res.json(trendData.filter(item => item !== null));
  } catch (error) {
    console.error('Stock Trends Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Trading Summary Endpoint ----------
app.get('/api/trading-summary', authenticateToken, async (req, res) => {
  try {
    // Convert string ID to ObjectId if needed
    const userId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;
      
    const summary = await OrdersModel.aggregate([
      { $match: { userId } },
      { $group: { 
          _id: "$mode", 
          totalQty: { $sum: "$qty" }, 
          totalValue: { $sum: { $multiply: ["$qty", "$price"] } },
          orderCount: { $sum: 1 }
        } 
      }
    ]);
    
    res.json(summary);
  } catch (error) {
    console.error('Trading Summary Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- All Available Stocks Endpoint ----------
app.get('/api/all-stocks', async (req, res) => {
  try {
    const symbols = Object.keys(demoStockData);
    const stocks = await Promise.all(symbols.map(async (symbol) => {
      const data = await fetchStockData(symbol);
      return {
        symbol,
        name: symbol, // You could add a mapping for full company names
        price: data.price,
        volume: data.volume,
        percent_change: data.percent_change
      };
    }));
    
    res.json(stocks);
  } catch (error) {
    console.error('All Stocks Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Team Performance Endpoint ----------
app.get('/api/team-performance', async (req, res) => {
  const teamMapping = {
    "Gryffindor": "RELIANCE",
    "Slytherin": "TCS",
    "Hufflepuff": "INFY",
    "Ravenclaw": "HDFC",
    "Durmstrang": "ICICIBANK"
  };

  try {
    const teamsPerformance = await Promise.all(Object.entries(teamMapping).map(async ([team, symbol]) => {
      const data = await fetchStockData(symbol);
      if (!data) return { team, symbol, performance: 0 };
      
      return { 
        team, 
        symbol, 
        performance: parseFloat(data.percent_change) 
      };
    }));
    
    res.json(teamsPerformance);
  } catch (error) {
    console.error('Team Performance Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Option Chain Endpoint ----------
app.get('/api/option-chain/:symbol', async (req, res) => {
  const { symbol } = req.params;
  if (!symbol) return res.status(400).json({ message: 'Stock symbol required' });
  
  try {
    const data = await fetchStockData(symbol);
    if (!data) {
      return res.status(404).json({ message: `No data available for symbol: ${symbol}` });
    }
    
    const basePrice = parseFloat(data.price);
    
    const optionChain = Array.from({ length: 5 }, (_, i) => {
      const offset = Math.random() * 0.2 - 0.1; // ±10% offset
      const strike = Math.round(basePrice * (1 + offset));
      const premium = parseFloat((Math.random() * 50 + 5).toFixed(2));
      const openInterest = Math.floor(Math.random() * 1000 + 100);
      const attackIntensity = parseFloat(((premium * openInterest) / 10000).toFixed(2));
      
      return {
        strike,
        expiry: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
        premium,
        openInterest,
        attackIntensity
      };
    });
    
    res.json({ symbol, optionChain });
  } catch (error) {
    console.error('Option Chain Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Portfolio Risk Analysis Endpoint ----------
app.get('/api/portfolio-risk', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    if (!holdings.length) return res.status(404).json({ message: 'No holdings found' });

    let totalValue = 0;
    let weightedRiskSum = 0;
    
    for (const holding of holdings) {
      const symbol = holding.symbol;
      if (!symbol || symbol.trim() === "") continue;
      
      const data = await fetchStockData(symbol);
      if (!data) continue;
      
      const currentPrice = parseFloat(data.price);
      const holdingValue = holding.quantity * currentPrice;
      
      totalValue += holdingValue;
      
      const riskFactor = riskFactors[symbol] || 0.5;
      weightedRiskSum += riskFactor * holdingValue;
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

// ---------- API Status Endpoint ----------
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

// ---------- Start Server and Connect to MongoDB ----------
const startServer = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log("Connected to MongoDB");
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Using ${getCurrentApiProvider()} as the initial data provider`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
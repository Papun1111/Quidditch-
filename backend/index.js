import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';

import { User } from './model/userModels.js';
import { OrdersModel } from './model/OrdersModel.js';
import { HoldingsModel } from './model/HoldingsModel.js';
// (Positions will be computed dynamically based on holdings and live data.)

const PORT = process.env.PORT || 3000;
const mongoURL = process.env.MONGO_URL;

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

// ---------- Risk Factors for Portfolio Analysis ----------
const riskFactors = {
  "RELIANCE": 0.3,
  "TCS": 0.4,
  "INFY": 0.5,
  "HDFC": 0.2,
  "ICICIBANK": 0.6
};

// ---------- Helper: Fetch Stock Data using Alpha Vantage TIME_SERIES_INTRADAY ----------
const fetchStockData = async (symbol) => {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${apiKey}`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    if (!data["Time Series (5min)"]) {
      console.error(`Missing time series data for ${symbol}:`, data);
      return null;
    }
    const timeSeries = data["Time Series (5min)"];
    // Sort the timestamps descending to get the latest
    const timestamps = Object.keys(timeSeries).sort((a, b) => new Date(b) - new Date(a));
    if (timestamps.length === 0) return null;
    const latest = timeSeries[timestamps[0]];
    const price = latest["4. close"];
    const open = latest["1. open"];
    const volume = latest["5. volume"];
    const percent_change = (((parseFloat(price) - parseFloat(open)) / parseFloat(open)) * 100).toFixed(2);
    return {
      price,
      volume,
      percent_change
    };
  } catch (err) {
    console.error(`Error fetching data for ${symbol}:`, err.message);
    return null;
  }
};

// ---------- Authentication Middleware ----------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Positions Endpoint (Dynamic, with Fallback) ----------
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
        const demo = demoStockData[symbol] || { price: holding.averagePrice, percent_change: 0 };
        return {
          symbol,
          companyName: symbol,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentPrice: demo.price,
          netChange: (demo.price - holding.averagePrice) * holding.quantity,
          dayChangePercent: demo.percent_change,
          isLoss: demo.price < holding.averagePrice
        };
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
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- New Order Endpoint (Buy/Sell with Live Price and Fallback) ----------
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
    if (isNaN(quantity)) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    const data = await fetchStockData(symbol);
    let currentPrice;
    if (!data) {
      currentPrice = (demoStockData[symbol] && demoStockData[symbol].price) || 0;
    } else {
      currentPrice = parseFloat(data.price);
    }
    if (isNaN(currentPrice) || currentPrice === 0) {
      return res.status(400).json({ message: 'Unable to fetch valid stock price' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found' });
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
    });
    await newOrder.save();
    res.json({ message: "Order processed successfully", currentPrice });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Stock Trends Endpoint (with Fallback) ----------
app.get('/api/stock-trends', async (req, res) => {
  try {
    const symbols = ["RELIANCE", "TCS", "INFY", "HDFC", "ICICIBANK"];
    const trendData = await Promise.all(symbols.map(async (symbol) => {
      if (!symbol || symbol.trim() === "") {
        console.error(`Empty symbol in trend data`);
        return null;
      }
      const data = await fetchStockData(symbol);
      if (!data) {
        const demo = demoStockData[symbol] || { price: 0, volume: 0, percent_change: 0 };
        return { symbol, currentPrice: demo.price, volume: demo.volume, dayChangePercent: demo.percent_change };
      }
      const currentPrice = parseFloat(data.price);
      const volume = parseInt(data.volume) || 0;
      const dayChangePercent = parseFloat(data.percent_change);
      return { symbol, currentPrice, volume, dayChangePercent };
    }));
    const trends = trendData.filter(item => item !== null);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Trading Summary Endpoint ----------
app.get('/api/trading-summary', authenticateToken, async (req, res) => {
  try {
    const summary = await OrdersModel.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$mode", totalQty: { $sum: "$qty" } } }
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- All Available Stocks Endpoint (Demo Data) ----------
app.get('/api/all-stocks', (req, res) => {
  res.json(Object.keys(demoStockData).map(symbol => ({
    symbol,
    ...demoStockData[symbol]
  })));
});

// ---------- New Feature: Team Performance Endpoint ----------
app.get('/api/team-performance', async (req, res) => {
  const teamMapping = {
    "Gryffindor": "RELIANCE",
    "Slytherin": "TCS",
    "Hufflepuff": "INFY",
    "Ravenclaw": "HDFC",
    "Durmstrang": "ICICIBANK"
  };

  const teamsPerformance = await Promise.all(Object.entries(teamMapping).map(async ([team, symbol]) => {
    const data = await fetchStockData(symbol);
    let performance;
    if (!data || !data.percent_change) {
      console.error(`Error fetching percent change for ${symbol}`);
      performance = demoStockData[symbol] ? demoStockData[symbol].percent_change : 0;
    } else {
      performance = parseFloat(data.percent_change);
    }
    return { team, symbol, performance };
  }));
  res.json(teamsPerformance);
});

// ---------- New Feature: Option Chain Endpoint (Bludger Attack Patterns) ----------
app.get('/api/option-chain/:symbol', async (req, res) => {
  const { symbol } = req.params;
  if (!symbol) return res.status(400).json({ message: 'Stock symbol required' });
  const data = await fetchStockData(symbol);
  const effectiveData = data || demoStockData[symbol];
  if (!effectiveData) {
    return res.status(500).json({ message: `Data not available for ${symbol}` });
  }
  const basePrice = parseFloat(effectiveData.price);
  if (isNaN(basePrice) || basePrice === 0) {
    return res.status(400).json({ message: 'Invalid base price for option chain calculation' });
  }
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
});
// ---------- New Feature: Portfolio Risk Analysis Endpoint ----------
app.get('/api/portfolio-risk', authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    if (!holdings.length) return res.status(400).json({ message: 'No holdings found' });

    let totalValue = 0;
    let weightedRiskSum = 0;
    for (const holding of holdings) {
      const symbol = holding.symbol;
      const data = await fetchStockData(symbol);
      let currentPrice;
      if (!data) {
        currentPrice = demoStockData[symbol] ? demoStockData[symbol].price : holding.averagePrice;
      } else {
        currentPrice = parseFloat(data.price);
      }
      const holdingValue = holding.quantity * currentPrice;
      totalValue += holdingValue;
      const riskFactor = riskFactors[symbol] || 0.5;
      weightedRiskSum += riskFactor * holdingValue;
    }
    const baselineRisk = totalValue ? weightedRiskSum / totalValue : 0;

    const trajectory = [baselineRisk];
    for (let i = 1; i < 10; i++) {
      const change = (Math.random() - 0.5) * 0.1;
      trajectory.push(parseFloat((trajectory[i - 1] + change).toFixed(3)));
    }
    res.json({ portfolioRisk: baselineRisk, trajectory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Start Server and Connect to MongoDB ----------
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose
    .connect(mongoURL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
});
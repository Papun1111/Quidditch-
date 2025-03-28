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

// ---------- Demo Data for fallback ----------
const demoStockData = {
  "RELIANCE": { price: 2400, volume: 20000, dayChangePercent: 0.5 },
  "TCS": { price: 3500, volume: 15000, dayChangePercent: 0.7 },
  "INFY": { price: 1500, volume: 25000, dayChangePercent: -0.3 },
  "HDFC": { price: 3000, volume: 12000, dayChangePercent: 0.2 },
  "ICICIBANK": { price: 650, volume: 30000, dayChangePercent: -0.1 }
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
      const apiKey = process.env.ALPHAVANTAGE_API_KEY;
      const stockUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.NS&apikey=${apiKey}`;
      try {
        const stockResponse = await axios.get(stockUrl);
        const data = stockResponse.data["Global Quote"];
        if (!data || !data["05. price"]) {
          console.error(`Error fetching data for ${symbol}:`, data);
          // Use demo data if available, otherwise fallback to holding data
          const demo = demoStockData[symbol] || { price: holding.averagePrice, dayChangePercent: 0 };
          return {
            symbol,
            companyName: symbol,
            quantity: holding.quantity,
            averagePrice: holding.averagePrice,
            currentPrice: demo.price,
            netChange: (demo.price - holding.averagePrice) * holding.quantity,
            dayChangePercent: demo.dayChangePercent,
            isLoss: demo.price < holding.averagePrice
          };
        }
        const currentPrice = parseFloat(data["05. price"]);
        const changePercentStr = data["10. change percent"];
        const dayChangePercent = changePercentStr ? parseFloat(changePercentStr.replace('%', '')) : 0;
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
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err.message);
        const demo = demoStockData[symbol] || { price: holding.averagePrice, dayChangePercent: 0 };
        return {
          symbol,
          companyName: symbol,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentPrice: demo.price,
          netChange: (demo.price - holding.averagePrice) * holding.quantity,
          dayChangePercent: demo.dayChangePercent,
          isLoss: demo.price < holding.averagePrice
        };
      }
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
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    const stockUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.NS&apikey=${apiKey}`;
    let currentPrice;
    try {
      const stockResponse = await axios.get(stockUrl);
      const data = stockResponse.data["Global Quote"];
      if (!data || !data["05. price"]) {
        console.error(`Error fetching price for ${symbol}:`, data);
        // Use demo fallback if live data not available
        currentPrice = (demoStockData[symbol] && demoStockData[symbol].price) || 0;
      } else {
        currentPrice = parseFloat(data["05. price"]);
      }
    } catch (err) {
      console.error(`Error fetching price for ${symbol}:`, err.message);
      currentPrice = (demoStockData[symbol] && demoStockData[symbol].price) || 0;
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
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    const trendData = await Promise.all(symbols.map(async (symbol) => {
      if (!symbol || symbol.trim() === "") {
        console.error(`Empty symbol in trend data`);
        return null;
      }
      const stockUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.NS&apikey=${apiKey}`;
      try {
        const stockResponse = await axios.get(stockUrl);
        const data = stockResponse.data["Global Quote"];
        if (!data || !data["05. price"]) {
          console.error(`Error fetching data for ${symbol}:`, data);
          const demo = demoStockData[symbol] || { price: 0, volume: 0, dayChangePercent: 0 };
          return { symbol, currentPrice: demo.price, volume: demo.volume, dayChangePercent: demo.dayChangePercent };
        }
        const currentPrice = parseFloat(data["05. price"]);
        const volume = parseInt(data["06. volume"]) || 0;
        const changePercentStr = data["10. change percent"];
        const dayChangePercent = changePercentStr ? parseFloat(changePercentStr.replace('%', '')) : 0;
        return { symbol, currentPrice, volume, dayChangePercent };
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err.message);
        const demo = demoStockData[symbol] || { price: 0, volume: 0, dayChangePercent: 0 };
        return { symbol, currentPrice: demo.price, volume: demo.volume, dayChangePercent: demo.dayChangePercent };
      }
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
  // Return demo stock data keys as available stocks
  res.json(Object.keys(demoStockData).map(symbol => ({
    symbol,
    ...demoStockData[symbol]
  })));
});

// ---------- Start Server and Connect to MongoDB ----------
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose
    .connect(mongoURL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
});

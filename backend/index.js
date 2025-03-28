import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { User } from './model/userModels.js';
import { PositionsModel } from './model/PositionsModel.js';
import { OrdersModel } from './model/OrdersModel.js';
import { HoldingsModel } from './model/HoldingsModel.js';

const PORT = process.env.PORT || 3000;
const url = process.env.MONGO_URL;

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Authentication middleware to protect routes
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

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, name, email, password } = req.body;

  // Validate required fields
  if (!username || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if either email or username is already taken
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ username, name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

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

// Get holdings for authenticated user
app.get("/api/holdings", authenticateToken, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    res.json(holdings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get positions for authenticated user
app.get("/api/positions", authenticateToken, async (req, res) => {
  try {
    const positions = await PositionsModel.find({ userId: req.user.id });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new order (buy/sell) and update holdings simulation for authenticated user
app.post("/api/newOrder", authenticateToken, async (req, res) => {
  try {
    const { symbol, qty, price, mode } = req.body;
    
    // Validate request body
    if (!symbol || !qty || !price || !mode) {
      return res.status(400).json({ message: 'Missing order parameters' });
    }
    if (!['buy', 'sell'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid order mode' });
    }
    const quantity = Number(qty);
    const orderPrice = Number(price);
    if (isNaN(quantity) || isNaN(orderPrice)) {
      return res.status(400).json({ message: 'Invalid quantity or price' });
    }

    // Retrieve user details
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (mode === 'buy') {
      const cost = quantity * orderPrice;
      // Check if user has enough balance
      if (user.balance < cost) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }
      // Update or create the holding
      let holding = await HoldingsModel.findOne({ userId: req.user.id, symbol });
      if (holding) {
        // Recalculate average price and update quantity
        const totalCost = holding.quantity * holding.averagePrice + cost;
        const newQuantity = holding.quantity + quantity;
        const newAvgPrice = totalCost / newQuantity;
        holding.quantity = newQuantity;
        holding.averagePrice = newAvgPrice;
        await holding.save();
      } else {
        holding = new HoldingsModel({
          userId: req.user.id,
          symbol,
          quantity: quantity,
          averagePrice: orderPrice
        });
        await holding.save();
      }
      // Deduct the cost from user's balance
      user.balance -= cost;
      await user.save();
    } else if (mode === 'sell') {
      // Find the user's holding
      let holding = await HoldingsModel.findOne({ userId: req.user.id, symbol });
      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient holdings to sell' });
      }
      // Calculate proceeds and update holding
      const proceeds = quantity * orderPrice;
      holding.quantity -= quantity;
      if (holding.quantity === 0) {
        await HoldingsModel.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
      // Add the proceeds to user's balance
      user.balance += proceeds;
      await user.save();
    }

    // Create and save the order record
    const newOrder = new OrdersModel({
      userId: req.user.id,
      symbol,
      qty: quantity,
      price: orderPrice,
      mode,
    });
    await newOrder.save();

    res.json({ message: "Order processed successfully" });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simulated stock trends endpoint with dynamic data generation for real-time dashboards
app.get('/api/stock-trends', async (req, res) => {
  try {
    let trends = [
      { symbol: "AAPL", currentPrice: 150, volume: 20000 },
      { symbol: "GOOGL", currentPrice: 2800, volume: 15000 },
      { symbol: "MSFT", currentPrice: 300, volume: 25000 },
      { symbol: "AMZN", currentPrice: 3500, volume: 12000 },
      { symbol: "TSLA", currentPrice: 700, volume: 30000 }
    ];

    // Simulate random fluctuations for price and volume
    trends = trends.map(stock => {
      const priceFluctuationPercent = (Math.random() - 0.5) * 0.1; // +/-5%
      const newPrice = stock.currentPrice * (1 + priceFluctuationPercent);
      const volumeFluctuationPercent = (Math.random() - 0.5) * 0.2; // +/-10%
      const newVolume = stock.volume * (1 + volumeFluctuationPercent);
      return {
        symbol: stock.symbol,
        currentPrice: parseFloat(newPrice.toFixed(2)),
        volume: Math.round(newVolume)
      };
    });

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Aggregated trading summary endpoint for charts (bar graphs/histograms)
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
   mongoose
    .connect(url).then(()=>{
      console.log("mongo connected")
    });
});

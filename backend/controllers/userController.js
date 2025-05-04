import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { User } from '../model/userModels.js';
import { HoldingsModel } from '../model/HoldingsModel.js';
import { fetchStockData } from '../services/stockService.js';

// User signup
export const signup = async (req, res) => {
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
    console.log(newUser);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User login
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user holdings
export const getHoldings = async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });
    res.json(holdings);
  } catch (error) {
    console.error('Holdings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user positions with real-time pricing
export const getPositions = async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user.id });

    const positions = await Promise.all(
      holdings.map(async (holding) => {
        const symbol = holding.symbol;
        if (!symbol || symbol.trim() === '') {
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
};

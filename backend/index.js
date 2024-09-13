require('dotenv').config();
const express=require ("express");
const mongoose=require('mongoose');
const bodyParser = require("body-parser");
const cors = require("cors");
import User from './model/userModels';
const PORT=process.env.PORT || 3000;
const url=process.env.MONGO_URL;
const app=express();
const { PositionsModel } = require("./model/PositionsModel");
// const { OrdersModel } = require("./model/OrdersModel");
const{HoldingsModel}=require("./model/HoldingsModel");
app.use(cors());
app.use(bodyParser.json());


app.get("/allHoldings", async (req, res) => {
  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});
app.get("/allPositions", async (req, res) => {
  let allPositions = await PositionsModel.find({});
  res.json(allPositions);
});
app.post("/newOrder", async (req, res) => {
  let newOrder = new OrdersModel({
    name: req.body.name,
    qty: req.body.qty,
    price: req.body.price,
    mode: req.body.mode,
  });

  newOrder.save();

  res.send("Order saved!");
});
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user instance with the hashed password
    const newUser = new User({ name, email, password: hashedPassword });

   
    await newUser.save();

    // Return success message
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.listen('3030',()=>{
    console.log('server is running on port 3030');
    mongoose.connect(url);
})


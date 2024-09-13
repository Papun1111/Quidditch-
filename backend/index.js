require('dotenv').config();
const express=require ("express");
const mongoose=require('mongoose');
const bodyParser = require("body-parser");
const cors = require("cors");

const PORT=process.env.PORT || 3000;
const url=process.env.MONGO_URL;
const app=express();
const {User} = require('./model/userModels');
const { PositionsModel } = require("./model/PositionsModel");
const {OrdersModel}=require("./model/OrdersModel");
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
  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const newUser = new User({ name, email, password: hashedPassword });

   
    await newUser.save();

   
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


require('dotenv').config();
const express=require ("express");
const mongoose=require('mongoose');
const bodyParser = require("body-parser");
const cors = require("cors");
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
app.listen('3030',()=>{
    console.log('server is running on port 3030');
    mongoose.connect(url);
})
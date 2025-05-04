// index.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import userRouter from './routes/userRouter.js';
import tradeRouter from './routes/tradeRouter.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getVRTradingPitData } from './controllers/tradeController.js'; 

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', userRouter);
app.use('/api', tradeRouter);

// WebSocket setup for VR Trading Pit
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
setInterval(async () => {
  const vrData = await getVRTradingPitData();
  io.emit("vrData", vrData);
}, 30000);

const startServer = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  httpServer.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port",process.env.PORT);
  });
};
startServer();

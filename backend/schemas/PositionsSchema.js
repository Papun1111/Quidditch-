import { Schema } from 'mongoose';

const PositionsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: String, default: 'equity' },
    symbol: { type: String, required: true },
    companyName: { type: String, required: true },
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    netChange: { type: Number, required: true }, // Net gain/loss value
    dayChangePercent: { type: Number, required: true }, // Daily percentage change
    isLoss: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export { PositionsSchema };

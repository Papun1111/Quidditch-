import mongoose from 'mongoose';
const { Schema } = mongoose;

const holdingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    averagePrice: { type: Number, required: true },
  },
  { timestamps: true }
);

const HoldingsModel = mongoose.model('Holding', holdingSchema);
export { HoldingsModel };

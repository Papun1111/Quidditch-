import mongoose from 'mongoose';
const { Schema } = mongoose;

const ordersSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    mode: { type: String, enum: ['buy', 'sell'], required: true },
    status: { type: String, default: 'pending' },
  },
  { timestamps: true }
);

const OrdersModel = mongoose.model('Order', ordersSchema);
export { OrdersModel };

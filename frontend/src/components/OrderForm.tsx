import React, { useState, useContext, FormEvent } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const OrderForm: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [symbol, setSymbol] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [mode, setMode] = useState<string>("buy");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:3000/api/newOrder",
        { symbol, qty, price, mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Order failed");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Place a New Order</h2>
      {message && <p className="mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label className="block mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
          Submit Order
        </button>
      </form>
    </div>
  );
};

export default OrderForm;

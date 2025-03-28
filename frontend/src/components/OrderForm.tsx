import React, { useState, useContext, FormEvent } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const OrderForm: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [symbol, setSymbol] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [mode, setMode] = useState<string>("buy");
  const [message, setMessage] = useState<string>("");
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Submit order without price – backend fetches live price.
      const res = await axios.post(
        "http://localhost:3000/api/newOrder",
        { symbol, qty, mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`${res.data.message}. Current Price: ${res.data.currentPrice}`);
      setFetchedPrice(res.data.currentPrice);
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
            placeholder="e.g., RELIANCE"
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
      {fetchedPrice !== null && (
        <p className="mt-4">
          Current Price for {symbol.toUpperCase()} is {fetchedPrice}
        </p>
      )}
    </div>
  );
};

export default OrderForm;

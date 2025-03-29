import React, { useState, useContext, FormEvent } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { motion } from "framer-motion";

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
    <div className="flex justify-center items-center min-h-screen bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-6 bg-transparent backdrop-blur-lg rounded-xl shadow-lg border border-gray-600/50"
      >
        {/* Title with animation */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-2xl font-bold text-white text-center mb-6"
        >
          Place a New Order
        </motion.h2>

        {/* Message animation */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-sm text-center mb-4 p-2 bg-gray-800/60 text-gray-200 rounded-lg"
          >
            {message}
          </motion.p>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Symbol Input */}
          <div>
            <label className="block text-white mb-1 font-semibold">Symbol</label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              whileHover={{ scale: 1.02 }}
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full p-3 bg-gray-900/50 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="e.g., RELIANCE"
              required
            />
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-white mb-1 font-semibold">Quantity</label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              whileHover={{ scale: 1.02 }}
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full p-3 bg-gray-900/50 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-white mb-1 font-semibold">Mode</label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              whileHover={{ scale: 1.02 }}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full p-3 bg-gray-900/50 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </motion.select>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold uppercase transition-transform duration-200 
                      hover:bg-blue-600 active:scale-95"
          >
            Submit Order
          </motion.button>
        </motion.form>

        {/* Display Current Price with animation */}
        {fetchedPrice !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-center text-gray-300"
          >
            Current Price for <span className="font-bold">{symbol.toUpperCase()}</span>: 
            <span className="text-green-400 font-bold"> ${fetchedPrice}</span>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default OrderForm;

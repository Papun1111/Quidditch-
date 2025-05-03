import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  exit:    { opacity: 0, y: 50, transition: { duration: 0.5 } },
};

const titleVariants = {
  hidden:  { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.2 } },
};

const messageVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const formVariants = {
  hidden:  { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.3 } },
};

function OrderForm() {
  const { token } = useContext(AuthContext);
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [mode, setMode] = useState("buy");
  const [message, setMessage] = useState("");
  const [fetchedPrice, setFetchedPrice] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(
        "https://zerodhaclonerepo.onrender.com/api/newOrder",
        { symbol, qty, mode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`${res.data.message}. Current Price: ${res.data.currentPrice}`);
      setFetchedPrice(res.data.currentPrice);
    } catch (err) {
      setMessage(err.response?.data?.message || "Order failed");
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-transparent">
      <AnimatePresence>
        <motion.div
          className="w-full max-w-md p-6 bg-transparent backdrop-blur-lg rounded-xl shadow-lg border border-gray-600/50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Title */}
          <motion.h2
            className="text-2xl font-bold text-white text-center mb-6"
            variants={titleVariants}
            initial="hidden"
            animate="visible"
          >
            Place a New Order
          </motion.h2>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.p
                key="orderMessage"
                className="text-sm text-center mb-4 p-2 bg-gray-800/60 text-gray-200 rounded-lg"
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Symbol Input */}
            <div>
              <label className="block text-white mb-1 font-semibold">Symbol</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                whileHover={{ scale: 1.02 }}
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
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
                onChange={e => setQty(e.target.value)}
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
                onChange={e => setMode(e.target.value)}
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
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold uppercase transition-transform duration-200 hover:bg-blue-600"
            >
              Submit Order
            </motion.button>
          </motion.form>

          {/* Display Current Price */}
          <AnimatePresence>
            {fetchedPrice !== null && (
              <motion.p
                key="fetchedPrice"
                className="mt-4 text-center text-gray-300"
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                Current Price for{" "}
                <span className="font-bold">{symbol.toUpperCase()}</span>:{" "}
                <span className="text-green-400 font-bold">${fetchedPrice}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default OrderForm;

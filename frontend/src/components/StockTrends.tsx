import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StockTrend {
  symbol: string;
  currentPrice: number;
  volume: number;
  dayChangePercent: number;
}

// Returns a gradient string for pill backgrounds based on index.
const getStockGradient = (index: number) => {
  const hue = (index * 137) % 360;
  return `linear-gradient(90deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 20) % 360}, 70%, 70%))`;
};

// Returns a solid color for chart bars based on index.
const getStockColor = (index: number) => {
  const hue = (index * 137) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const StockTrends: React.FC = () => {
  const [trends, setTrends] = useState<StockTrend[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/stock-trends");
        setTrends(res.data);
        // Initially select all stocks
        setSelectedSymbols(res.data.map((stock: StockTrend) => stock.symbol));
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrends();
  }, []);

  // Toggle a stock's visibility
  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  // Filter trends based on selected stocks
  const filteredTrends = trends.filter(stock => selectedSymbols.includes(stock.symbol));

  // Build chart data: each bar gets its unique color.
  const data = {
    labels: filteredTrends.map(stock => stock.symbol),
    datasets: [
      {
        label: "Current Price",
        data: filteredTrends.map(stock => stock.currentPrice),
        backgroundColor: filteredTrends.map((_, index) => getStockColor(index)),
      },
    ],
  };

  // Framer Motion variants for container and pills.
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const pillVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    // "pop" animation on tap is achieved with whileTap.
  };

  return (
    <motion.div 
      className="w-full min-h-screen bg-gradient-to-r from-black to-gray-800 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto w-full">
        <motion.h2 
          className="text-3xl font-bold text-white text-center mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Stock Trends
        </motion.h2>

        {/* Pills for toggling stock visibility */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {trends.map((stock, index) => {
            const isSelected = selectedSymbols.includes(stock.symbol);
            return (
              <motion.button
                key={stock.symbol}
                variants={pillVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleSymbol(stock.symbol)}
                className="px-4 py-2 rounded-full border transition-colors duration-300"
                style={
                  isSelected
                    ? { background: getStockGradient(index), borderColor: getStockColor(index), color: 'white' }
                    : {}
                }
              >
                {stock.symbol}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Chart container with animated transitions */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-4 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence exitBeforeEnter>
            {filteredTrends.length > 0 ? (
              <motion.div
                key={filteredTrends.map(s => s.symbol).join("-")}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                <Bar data={data} />
              </motion.div>
            ) : (
              <motion.p
                key="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-gray-600"
              >
                No stocks selected.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StockTrends;

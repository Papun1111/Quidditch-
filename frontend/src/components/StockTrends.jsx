import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Linear gradient for pills
const getPillGradient = index => {
  const hue = (index * 137) % 360;
  return `linear-gradient(120deg, hsla(${hue},90%,50%,0.9), hsla(${(hue+30)%360},90%,50%,0.7))`;
};

// Solid color for charts
const getColor = (index, alpha = 0.6) => {
  const hue = (index * 137) % 360;
  return `hsla(${hue},80%,50%,${alpha})`;
};

function StockTrends() {
  const [trends, setTrends] = useState([]);
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const url=import.meta.env.VITE_API_URL;
  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await axios.get(`${url}/stock-trends`);
        setTrends(res.data);
        setSelectedSymbols(res.data.map(stock => stock.symbol));
      } catch (err) {
        console.error(err);
        setError('Failed to load stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  const toggleSymbol = symbol => {
    setSelectedSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const filteredTrends = trends.filter(stock =>
    selectedSymbols.includes(stock.symbol)
  );

  // Prepare combo chart data
  const labels = filteredTrends.map(s => s.symbol);
  const prices = filteredTrends.map(s => s.currentPrice);
  const changes = filteredTrends.map(s => s.dayChangePercent);

  const comboData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Current Price',
        data: prices,
        backgroundColor: labels.map((_,i) => getColor(i,0.4)),
        borderColor: labels.map((_,i) => getColor(i,1)),
        borderWidth: 1.5,
        yAxisID: 'y1',
      },
      {
        type: 'line',
        label: 'Day Change (%)',
        data: changes,
        borderColor: 'rgba(255,255,255,0.8)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        pointBackgroundColor: 'rgba(255,255,255,0.9)',
        pointBorderColor: '#fff',
        tension: 0.3,
        yAxisID: 'y2',
      }
    ]
  };

  const comboOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y1: { type: 'linear', position: 'left' },
      y2: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false }
      }
    },
    plugins: {
      legend: {
        labels: { color: 'rgba(255,255,255,0.9)' }
      }
    }
  };

  const doughnutData = {
    labels,
    datasets: [{
      label: 'Volume',
      data: filteredTrends.map(s => s.volume),
      backgroundColor: labels.map((_,i) => getColor(i,0.4)),
      borderColor: labels.map((_,i) => getColor(i,1)),
      borderWidth: 1.5,
    }]
  };

  if (loading) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-white text-lg">Loading stock data...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-red-500 text-lg">{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 70 }}
    >
      <div className="container mx-auto max-w-6xl">
        <motion.h2
          className="text-3xl font-bold text-white text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
        >
          Stock Trends
        </motion.h2>

        <motion.div className="flex flex-wrap justify-center gap-4 mb-8">
          {trends.map((stock, idx) => {
            const isSelected = selectedSymbols.includes(stock.symbol);
            return (
              <motion.button
                key={stock.symbol}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className={`
                  px-4 py-2 rounded-full border text-white font-medium
                  transition-colors duration-300 shadow
                  ${isSelected
                    ? 'border-transparent'
                    : 'border-gray-500 bg-gray-700 hover:bg-gray-600'
                  }
                `}
                style={
                  isSelected
                    ? {
                        background: getPillGradient(idx),
                        borderColor: getColor(idx,1)
                      }
                    : {}
                }
                onClick={() => toggleSymbol(stock.symbol)}
              >
                {stock.symbol}
              </motion.button>
            );
          })}
        </motion.div>

        {filteredTrends.length === 0 && (
          <motion.p
            className="text-gray-400 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No stocks selected.
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {filteredTrends.length > 0 && (
            <motion.div
              key={filteredTrends.map(s => s.symbol).join('-')}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white bg-opacity-5 backdrop-blur rounded-lg p-4 shadow">
                  <div className="relative w-full h-96">
                    <Bar data={comboData} options={comboOptions} />
                  </div>
                </div>
                <div className="bg-white bg-opacity-5 backdrop-blur rounded-lg p-4 shadow">
                  <div className="relative w-full h-96">
                    <Doughnut data={doughnutData} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default StockTrends;

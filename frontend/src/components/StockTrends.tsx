import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';

// Register the chart.js components you plan to use
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

interface StockTrend {
  symbol: string;
  currentPrice: number;
  volume: number;
  dayChangePercent: number;
}

// Generate a **linear gradient** background for pills based on index
const getPillGradient = (index: number) => {
  const hue = (index * 137) % 360;
  return `linear-gradient(120deg, hsla(${hue}, 90%, 50%, 0.9), hsla(${
    (hue + 30) % 360
  }, 90%, 50%, 0.7))`;
};

// Generate a **solid** color (with partial transparency) for chart datasets based on index
const getColor = (index: number, alpha = 0.6) => {
  const hue = (index * 137) % 360;
  return `hsla(${hue}, 80%, 50%, ${alpha})`;
};

const StockTrends: React.FC = () => {
  const [trends, setTrends] = useState<StockTrend[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stock data on mount
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/stock-trends');
        setTrends(res.data);
        // Select all stocks by default
        setSelectedSymbols(res.data.map((stock: StockTrend) => stock.symbol));
      } catch (err: any) {
        console.error(err);
        setError('Failed to load stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  // Toggle a stock symbol on/off in the selection
  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Filter data based on selected symbols
  const filteredTrends = trends.filter(stock =>
    selectedSymbols.includes(stock.symbol)
  );

  // Prepare multi-dataset chart for Current Price & Day Change
  // We'll place them in a "bar + line" combo chart using the same labels.
  const comboLabels = filteredTrends.map(stock => stock.symbol);
  const priceData = filteredTrends.map(stock => stock.currentPrice);
  const dayChangeData = filteredTrends.map(stock => stock.dayChangePercent);

  const comboData = {
    labels: comboLabels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Current Price',
        data: priceData,
        backgroundColor: comboLabels.map((_, i) => getColor(i, 0.4)),
        borderColor: comboLabels.map((_, i) => getColor(i, 1)),
        borderWidth: 1.5,
        yAxisID: 'y1',
      },
      {
        type: 'line' as const,
        label: 'Day Change (%)',
        data: dayChangeData,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        pointBackgroundColor: 'rgba(255, 255, 255, 0.9)',
        pointBorderColor: '#ffffff',
        tension: 0.3,
        yAxisID: 'y2',
      },
    ],
  };

  // Chart options for the combo chart, including dual y-axes
  const comboOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255,255,255,0.9)',
        },
      },
    },
  };

  // Prepare Doughnut chart data for Volume distribution
  const doughnutData = {
    labels: filteredTrends.map(stock => stock.symbol),
    datasets: [
      {
        label: 'Volume',
        data: filteredTrends.map(stock => stock.volume),
        backgroundColor: filteredTrends.map((_, i) => getColor(i, 0.4)),
        borderColor: filteredTrends.map((_, i) => getColor(i, 1)),
        borderWidth: 1.5,
      },
    ],
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
        {/* Title */}
        <motion.h2
          className="text-3xl font-bold text-white text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
        >
          Stock Trends
        </motion.h2>

        {/* Symbol Pills */}
        <motion.div className="flex flex-wrap justify-center gap-4 mb-8">
          {trends.map((stock, index) => {
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
                  ${
                    isSelected
                      ? 'border-transparent'
                      : 'border-gray-500 bg-gray-700 hover:bg-gray-600'
                  }
                `}
                style={
                  isSelected
                    ? { 
                        background: getPillGradient(index),
                        borderColor: getColor(index, 1)
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

        {/* If no symbols are selected, show a message */}
        {filteredTrends.length === 0 && (
          <motion.p
            className="text-gray-400 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No stocks selected.
          </motion.p>
        )}

        {/* Charts */}
        <AnimatePresence mode="wait">
          {filteredTrends.length > 0 && (
            <motion.div
              key={filteredTrends.map(s => s.symbol).join("-")}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {/* Grid to hold both charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Price + Day Change (Combo) Chart */}
                <div className="bg-white bg-opacity-5 backdrop-blur rounded-lg p-4 shadow">
                  <div className="relative w-full h-96">
                    <Bar data={comboData} options={comboOptions} />
                  </div>
                </div>

                {/* Volume Distribution (Doughnut) Chart */}
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
};

export default StockTrends;

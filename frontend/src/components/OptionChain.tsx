import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaLayerGroup } from 'react-icons/fa';

Chart.register(ArcElement, Tooltip, Legend);

interface OptionContract {
  strike: number;
  expiry: string;
  premium: number;
  openInterest: number;
  attackIntensity: number;
}

interface OptionChainResponse {
  symbol: string;
  optionChain: OptionContract[];
}

const OptionChain: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('');
  const [optionChain, setOptionChain] = useState<OptionContract[]>([]);
  const [error, setError] = useState<string>('');

  const handleFetch = async () => {
    if (!symbol) {
      setError('Please enter a stock symbol.');
      return;
    }
    setError('');
    try {
      const res = await axios.get<OptionChainResponse>(`https://zerodhaclonerepo.onrender.com/api/option-chain/${symbol}`);
      setOptionChain(res.data.optionChain);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching option chain');
    }
  };

  // Prepare data for the pie chart (open interest distribution)
  const pieData = {
    labels: optionChain.map(contract => `Strike ${contract.strike}`),
    datasets: [
      {
        label: 'Open Interest',
        data: optionChain.map(contract => contract.openInterest),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#66FF66'
        ],
        hoverBackgroundColor: [
          '#FF6384AA',
          '#36A2EBAA',
          '#FFCE56AA',
          '#4BC0C0AA',
          '#9966FFAA',
          '#FF9F40AA',
          '#66FF66AA'
        ],
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-extrabold mb-2 flex items-center justify-center">
          <FaLayerGroup className="mr-2" size={32} />
          Option Chain (Bludger Attack Patterns)
        </h2>
        <p className="text-lg text-gray-600">
          Explore the option chain and see open interest distribution
        </p>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          placeholder="e.g., AAPL"
        />
        <button
          onClick={handleFetch}
          className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors duration-300"
        >
          Fetch Option Chain
        </button>
      </div>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {optionChain.length > 0 && (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {optionChain.map((contract, idx) => (
              <motion.div
                key={idx}
                className="p-6 rounded-2xl shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white transform hover:shadow-3xl"
                whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <h3 className="text-2xl font-bold mb-2">Strike: {contract.strike}</h3>
                <p className="mb-1">Expiry: {contract.expiry}</p>
                <p className="mb-1">Premium: {contract.premium}</p>
                <p className="mb-1">Open Interest: {contract.openInterest}</p>
                <p className="mb-1">Attack Intensity: {contract.attackIntensity}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-10">
            <h3 className="text-3xl font-bold mb-4 text-center">Open Interest Distribution</h3>
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Pie data={pieData} />
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OptionChain;

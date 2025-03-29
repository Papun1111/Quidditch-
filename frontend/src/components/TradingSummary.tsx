import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { motion } from 'framer-motion';

interface SummaryItem {
  symbol: string;
  totalBuyQty: number;
  totalBuyValue: number;
  totalSellQty: number;
  totalSellValue: number;
  orderCount: number;
  profit: number;
  avgBuyPrice: number;
  avgSellPrice: number;
}

const TradingSummary: React.FC = () => {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const { token, darkMode } = useContext(AuthContext);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/trading-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching trading summary');
      }
    };
    fetchSummary();
  }, [token]);

  const containerBg = darkMode
    ? "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900"
    : "bg-gradient-to-r from-white to-blue-50";
  const textColor = darkMode ? "text-white" : "text-gray-800";

  return (
    <div className={`container mx-auto p-6 ${containerBg} rounded-lg shadow-xl transition-colors duration-500`}>
      <h2 className={`text-4xl font-extrabold tracking-wider mb-6 ${textColor}`}>Trading Summary</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {summary.length > 0 ? (
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border">Symbol</th>
                <th className="py-2 px-4 border">Buy Qty</th>
                <th className="py-2 px-4 border">Buy Value</th>
                <th className="py-2 px-4 border">Sell Qty</th>
                <th className="py-2 px-4 border">Sell Value</th>
                <th className="py-2 px-4 border">Profit</th>
                <th className="py-2 px-4 border">Avg Buy Price</th>
                <th className="py-2 px-4 border">Avg Sell Price</th>
                <th className="py-2 px-4 border">Orders</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item, index) => (
                <motion.tr
                  key={index}
                  className="border-b hover:bg-gray-100"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <td className="py-2 px-4 border">{item.symbol}</td>
                  <td className="py-2 px-4 border">{item.totalBuyQty}</td>
                  <td className="py-2 px-4 border">${item.totalBuyValue.toFixed(2)}</td>
                  <td className="py-2 px-4 border">{item.totalSellQty}</td>
                  <td className="py-2 px-4 border">${item.totalSellValue.toFixed(2)}</td>
                  <td className="py-2 px-4 border">${item.profit.toFixed(2)}</td>
                  <td className="py-2 px-4 border">${item.avgBuyPrice.toFixed(2)}</td>
                  <td className="py-2 px-4 border">${item.avgSellPrice.toFixed(2)}</td>
                  <td className="py-2 px-4 border">{item.orderCount}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <p className={`text-center ${textColor}`}>No trading data available.</p>
      )}
    </div>
  );
};

export default TradingSummary;

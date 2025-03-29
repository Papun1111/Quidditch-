import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { motion } from 'framer-motion';
import { FaChartLine } from 'react-icons/fa';

interface Position {
  _id?: string;
  symbol: string;
  companyName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  netChange: number;
  dayChangePercent: number;
  isLoss: boolean;
}

const Positions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const { token, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/positions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPositions(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPositions();
  }, [token]);

  // Define background and text classes based on dark mode
  const cardBg = darkMode
    ? "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900"
    : "bg-gradient-to-r from-white to-gray-100";
  const textColor = darkMode ? "text-gray-100" : "text-gray-800";

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <FaChartLine className={`mr-2 ${textColor}`} size={28} />
        <h2 className={`text-3xl font-bold ${textColor}`}>Your Positions</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((position, index) => (
          <motion.div
            key={position._id || index}
            className={`p-6 ${cardBg} rounded-lg shadow-lg transition-transform duration-300 cursor-pointer`}
            whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{position.symbol}</h3>
            <p className={`${textColor}`}>Company: {position.companyName}</p>
            <p className={`${textColor}`}>Quantity: {position.quantity}</p>
            <p className={`${textColor}`}>Avg. Price: {position.averagePrice}</p>
            <p className={`${textColor}`}>Current Price: {position.currentPrice}</p>
            <p className={`${textColor}`}>Net Change: {position.netChange.toFixed(2)}</p>
            <p className={`${textColor}`}>Day Change: {position.dayChangePercent}%</p>
            <p className={`${textColor}`}>Loss: {position.isLoss ? "Yes" : "No"}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Positions;

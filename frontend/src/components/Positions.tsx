import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { motion } from "framer-motion";
import { FaChartLine } from "react-icons/fa";

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
  const { token } = useContext(AuthContext);

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

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <FaChartLine className="mr-2 text-white" size={28} />
        <h2 className="text-3xl font-extrabold text-white">Your Positions</h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {positions.map((position, index) => (
          <motion.div
            key={position._id || index}
            className="relative p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-2xl shadow-xl transition-transform duration-300 border border-gray-500/50 backdrop-blur-md 
                      hover:shadow-2xl hover:scale-105 transform cursor-pointer"
            whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {/* Stock Symbol */}
            <h3 className="text-3xl font-extrabold text-white uppercase text-center mb-4">
              {position.symbol}
            </h3>

            {/* Divider */}
            <div className="border-b border-gray-600 mb-4"></div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <p className="font-semibold text-gray-300">Company:</p>
              <p className="text-gray-100">{position.companyName}</p>

              <p className="font-semibold text-gray-300">Quantity:</p>
              <p className="text-gray-100">{position.quantity}</p>

              <p className="font-semibold text-gray-300">Avg. Price:</p>
              <p className="text-gray-100">${position.averagePrice.toFixed(2)}</p>

              <p className="font-semibold text-gray-300">Current Price:</p>
              <p className="text-gray-100">${position.currentPrice.toFixed(2)}</p>

              <p className="font-semibold text-gray-300">Net Change:</p>
              <p className={position.netChange < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                ${position.netChange.toFixed(2)}
              </p>

              <p className="font-semibold text-gray-300">Day Change:</p>
              <p className={position.dayChangePercent < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                {position.dayChangePercent.toFixed(2)}%
              </p>

              <p className="font-semibold text-gray-300">Loss:</p>
              <p className={position.isLoss ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                {position.isLoss ? "Yes" : "No"}
              </p>
            </div>

            {/* Bottom Glow Effect */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Positions;

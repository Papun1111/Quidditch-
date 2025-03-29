import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { motion } from 'framer-motion';
import { FaWallet } from 'react-icons/fa';

interface Holding {
  _id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
}

// Variants for the list container and list items
const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const Holdings: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/holdings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHoldings(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHoldings();
  }, [token]);

  return (
    <motion.div 
      className="container mx-auto p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaWallet className="mr-2 text-blue-500" /> Your Holdings
        </h2>
      </div>
      <div className="overflow-x-auto">
        <motion.table 
          className="min-w-full bg-white rounded-lg overflow-hidden shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-5 text-left text-gray-700">Symbol</th>
              <th className="py-3 px-5 text-left text-gray-700">Quantity</th>
              <th className="py-3 px-5 text-left text-gray-700">Avg. Price</th>
            </tr>
          </thead>
          <motion.tbody
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {holdings.map((holding) => (
              <motion.tr
                key={holding._id}
                variants={itemVariants}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-300"
              >
                <td className="py-3 px-5 text-gray-800">{holding.symbol}</td>
                <td className="py-3 px-5 text-gray-800">{holding.quantity}</td>
                <td className="py-3 px-5 text-gray-800">{holding.averagePrice}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </motion.table>
      </div>
    </motion.div>
  );
};

export default Holdings;

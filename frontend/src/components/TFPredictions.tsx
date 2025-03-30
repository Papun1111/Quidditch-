import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

interface PredictionResult {
  symbol: string;
  predictedPrice: number;
  predictedChangePercent: number;
  recommendation: string;
  description: string;
}

const TFPredictionsHoldings: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get<PredictionResult[]>(
          "https://zerodhaclonerepo.onrender.com/api/tf-holdings-predictions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPredictions(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching predictions");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-black min-h-screen p-6">
      <motion.h2
        className="text-3xl font-bold text-white mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Holdings Predictions
      </motion.h2>

      {error && <p className="text-red-500">{error}</p>}

      {predictions.length > 0 ? (
        <motion.table
          className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="py-2 px-4">Symbol</th>
              <th className="py-2 px-4">Predicted Price</th>
              <th className="py-2 px-4">Predicted Change %</th>
              <th className="py-2 px-4">Recommendation</th>
              <th className="py-2 px-4">Description</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred, index) => (
              <motion.tr
                key={index}
                className="border-b border-gray-700 hover:bg-gray-600 transition"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <td className="py-2 px-4 text-white">{pred.symbol}</td>
                <td className="py-2 px-4 text-white">
                  ${pred.predictedPrice.toFixed(2)}
                </td>
                <td
                  className={`py-2 px-4 ${
                    pred.predictedChangePercent > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {pred.predictedChangePercent.toFixed(2)}%
                </td>
                <td
                  className={`py-2 px-4 font-semibold ${
                    pred.recommendation.includes("Sell")
                      ? "text-red-500"
                      : pred.recommendation.includes("Buy")
                      ? "text-green-500"
                      : "text-yellow-400"
                  }`}
                >
                  {pred.recommendation}
                </td>
                <td className="py-2 px-4 text-white">
                  {pred.description}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      ) : (
        <p className="text-gray-300 mt-4">No predictions available.</p>
      )}
    </div>
  );
};

export default TFPredictionsHoldings;

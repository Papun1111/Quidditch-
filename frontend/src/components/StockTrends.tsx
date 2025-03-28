import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
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

const StockTrends: React.FC = () => {
  const [trends, setTrends] = useState<StockTrend[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/stock-trends");
        setTrends(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrends();
  }, []);

  const data = {
    labels: trends.map(stock => stock.symbol),
    datasets: [
      {
        label: "Current Price",
        data: trends.map(stock => stock.currentPrice),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Stock Trends</h2>
      <Bar data={data} />
    </div>
  );
};

export default StockTrends;

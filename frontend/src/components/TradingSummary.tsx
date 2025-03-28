import React, { useState, useEffect, useContext } from 'react';
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
import { AuthContext } from './AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TradingSummaryItem {
  _id: string;
  totalQty: number;
}

const TradingSummary: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState<TradingSummaryItem[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/trading-summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSummary();
  }, [token]);

  const data = {
    labels: summary.map(item => item._id),
    datasets: [
      {
        label: "Total Quantity",
        data: summary.map(item => item.totalQty),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Trading Summary</h2>
      <Bar data={data} />
    </div>
  );
};

export default TradingSummary;

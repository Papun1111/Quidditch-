import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { AuthContext } from './AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

interface PortfolioRiskResponse {
  portfolioRisk: number;
  trajectory: number[];
}

const PortfolioRisk: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [riskData, setRiskData] = useState<PortfolioRiskResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await axios.get<PortfolioRiskResponse>('http://localhost:3000/api/portfolio-risk', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRiskData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching portfolio risk');
      }
    };
    fetchRisk();
  }, [token]);

  const data = {
    labels: riskData?.trajectory.map((_, idx) => `T${idx + 1}`) || [],
    datasets: [
      {
        label: 'Risk Trajectory',
        data: riskData?.trajectory || [],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Portfolio Risk Analysis (Seeker Trajectory)</h2>
      {error && <p className="text-red-500">{error}</p>}
      {riskData ? (
        <div>
          <p><strong>Current Portfolio Risk:</strong> {riskData.portfolioRisk.toFixed(3)}</p>
          <div className="mt-4">
            <Line data={data} />
          </div>
        </div>
      ) : (
        <p>Loading risk data...</p>
      )}
    </div>
  );
};

export default PortfolioRisk;

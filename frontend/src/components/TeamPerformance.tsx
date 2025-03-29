import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TeamPerformance {
  team: string;
  symbol: string;
  performance: number;
}

const TeamPerformance: React.FC = () => {
  const [data, setData] = useState<TeamPerformance[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/team-performance');
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching team performance');
      }
    };
    fetchPerformance();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Team Performance</h2>
      {error && <p className="text-red-500">{error}</p>}
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Team</th>
            <th className="py-2 px-4 border">Symbol</th>
            <th className="py-2 px-4 border">Performance (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td className="py-2 px-4 border">{item.team}</td>
              <td className="py-2 px-4 border">{item.symbol}</td>
              <td
                className="py-2 px-4 border"
                style={{ color: item.performance >= 0 ? 'green' : 'red' }}
              >
                {item.performance.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamPerformance;

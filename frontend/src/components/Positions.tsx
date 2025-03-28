import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

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
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Positions</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Symbol</th>
            <th className="py-2 px-4 border">Company Name</th>
            <th className="py-2 px-4 border">Quantity</th>
            <th className="py-2 px-4 border">Avg. Price</th>
            <th className="py-2 px-4 border">Current Price</th>
            <th className="py-2 px-4 border">Net Change</th>
            <th className="py-2 px-4 border">Day Change %</th>
            <th className="py-2 px-4 border">Loss?</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => (
            <tr key={index}>
              <td className="py-2 px-4 border">{position.symbol}</td>
              <td className="py-2 px-4 border">{position.companyName}</td>
              <td className="py-2 px-4 border">{position.quantity}</td>
              <td className="py-2 px-4 border">{position.averagePrice}</td>
              <td className="py-2 px-4 border">{position.currentPrice}</td>
              <td className="py-2 px-4 border">{position.netChange.toFixed(2)}</td>
              <td className="py-2 px-4 border">{position.dayChangePercent}%</td>
              <td className="py-2 px-4 border">{position.isLoss ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Positions;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

interface Holding {
  _id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
}

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
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Holdings</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="py-2 px-4 border">Symbol</th>
            <th className="py-2 px-4 border">Quantity</th>
            <th className="py-2 px-4 border">Average Price</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding._id}>
              <td className="py-2 px-4 border">{holding.symbol}</td>
              <td className="py-2 px-4 border">{holding.quantity}</td>
              <td className="py-2 px-4 border">{holding.averagePrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Holdings;

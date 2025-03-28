import React, { useState } from 'react';
import axios from 'axios';

interface OptionContract {
  strike: number;
  expiry: string;
  premium: number;
  openInterest: number;
  attackIntensity: number;
}

interface OptionChainResponse {
  symbol: string;
  optionChain: OptionContract[];
}

const OptionChain: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('');
  const [optionChain, setOptionChain] = useState<OptionContract[]>([]);
  const [error, setError] = useState<string>('');

  const handleFetch = async () => {
    if (!symbol) {
      setError('Please enter a stock symbol.');
      return;
    }
    setError('');
    try {
      const res = await axios.get<OptionChainResponse>(`http://localhost:3000/api/option-chain/${symbol}`);
      setOptionChain(res.data.optionChain);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching option chain');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Option Chain (Bludger Attack Patterns)</h2>
      <div className="mb-4">
        <label className="block mb-1">Stock Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., RELIANCE"
        />
      </div>
      <button onClick={handleFetch} className="bg-blue-500 text-white py-2 px-4 rounded">
        Fetch Option Chain
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {optionChain.length > 0 && (
        <table className="min-w-full bg-white shadow rounded mt-4">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Strike</th>
              <th className="py-2 px-4 border">Expiry</th>
              <th className="py-2 px-4 border">Premium</th>
              <th className="py-2 px-4 border">Open Interest</th>
              <th className="py-2 px-4 border">Attack Intensity</th>
            </tr>
          </thead>
          <tbody>
            {optionChain.map((contract, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border">{contract.strike}</td>
                <td className="py-2 px-4 border">{contract.expiry}</td>
                <td className="py-2 px-4 border">{contract.premium}</td>
                <td className="py-2 px-4 border">{contract.openInterest}</td>
                <td className="py-2 px-4 border">{contract.attackIntensity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OptionChain;

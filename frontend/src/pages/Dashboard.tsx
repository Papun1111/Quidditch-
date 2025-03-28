import React, { useState, useContext } from 'react';
import Holdings from '../components/Holdings';
import Positions from '../components/Positions';
import OrderForm from '../components/OrderForm';
import StockTrends from '../components/StockTrends';
import TradingSummary from '../components/TradingSummary';
import { AuthContext } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("holdings");
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "holdings":
        return <Holdings />;
      case "positions":
        return <Positions />;
      case "newOrder":
        return <OrderForm />;
      case "stockTrends":
        return <StockTrends />;
      case "tradingSummary":
        return <TradingSummary />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Trading Dashboard</h1>
        <div>
          <button className="mr-4 hover:underline" onClick={() => setActiveTab("holdings")}>
            Holdings
          </button>
          <button className="mr-4 hover:underline" onClick={() => setActiveTab("positions")}>
            Positions
          </button>
          <button className="mr-4 hover:underline" onClick={() => setActiveTab("newOrder")}>
            New Order
          </button>
          <button className="mr-4 hover:underline" onClick={() => setActiveTab("stockTrends")}>
            Stock Trends
          </button>
          <button className="mr-4 hover:underline" onClick={() => setActiveTab("tradingSummary")}>
            Trading Summary
          </button>
          <button className="hover:underline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <div className="p-4">{renderTab()}</div>
    </div>
  );
};

export default Dashboard;

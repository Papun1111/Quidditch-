import React, { useState, useContext } from 'react';
import Holdings from '../components/Holdings';
import Positions from '../components/Positions';
import OrderForm from '../components/OrderForm';
import StockTrends from '../components/StockTrends';
import TradingSummary from '../components/TradingSummary';
import TeamPerformance from '../components/TeamPerformance';
import OptionChain from '../components/OptionChain';
import PortfolioRisk from '../components/PortfolioRisk';
import VRTradingPit from '../components/VRTradingPit'; // New component
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
      case "teamPerformance":
        return <TeamPerformance />;
      case "optionChain":
        return <OptionChain />;
      case "portfolioRisk":
        return <PortfolioRisk />;
      case "vrTradingPit":
        return <VRTradingPit />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 flex flex-wrap justify-between items-center">
        <h1 className="text-xl font-bold mb-2 md:mb-0">Trading Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab("holdings")} className="hover:underline">Holdings</button>
          <button onClick={() => setActiveTab("positions")} className="hover:underline">Positions</button>
          <button onClick={() => setActiveTab("newOrder")} className="hover:underline">New Order</button>
          <button onClick={() => setActiveTab("stockTrends")} className="hover:underline">Stock Trends</button>
          <button onClick={() => setActiveTab("tradingSummary")} className="hover:underline">Trading Summary</button>
          <button onClick={() => setActiveTab("teamPerformance")} className="hover:underline">Team Performance</button>
          <button onClick={() => setActiveTab("optionChain")} className="hover:underline">Option Chain</button>
          <button onClick={() => setActiveTab("portfolioRisk")} className="hover:underline">Portfolio Risk</button>
          <button onClick={() => setActiveTab("vrTradingPit")} className="hover:underline">VR Trading Pit</button>
          <button onClick={handleLogout} className="hover:underline">Logout</button>
        </div>
      </nav>
      <div className="p-4">{renderTab()}</div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  FaWallet, 
  FaChartLine, 
  FaPlus, 
  FaChartArea, 
  FaRegChartBar, 
  FaUsers, 
  FaSlidersH, 
  FaShieldAlt, 
  FaSignOutAlt 
} from 'react-icons/fa';
import Holdings from '../components/Holdings';
import Positions from '../components/Positions';
import OrderForm from '../components/OrderForm';
import StockTrends from '../components/StockTrends';
import TradingSummary from '../components/TradingSummary';
import TeamPerformance from '../components/TeamPerformance';
import OptionChain from '../components/OptionChain';
import PortfolioRisk from '../components/PortfolioRisk';
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
      default:
        return null;
    }
  };

  // Fixed container classes for a full-width dark theme
  const containerClasses = "min-h-screen bg-gradient-to-r from-gray-800 to-black text-white";
  const navClasses = "bg-gray-900 text-white p-4 flex flex-wrap justify-between items-center";

  // Framer Motion variants for button animations
  const buttonVariants = {
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  return (
    <div className={containerClasses}>
      <nav className={navClasses}>
        <motion.h1 
          className="text-xl font-bold mb-2 md:mb-0 flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaWallet className="mr-2" /> Quidditch Market Dashboard
        </motion.h1>
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("holdings")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaWallet size={20} title="Holdings" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("positions")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaChartLine size={20} title="Positions" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("newOrder")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaPlus size={20} title="New Order" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("stockTrends")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaChartArea size={20} title="Stock Trends" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("tradingSummary")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaRegChartBar size={20} title="Trading Summary" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("teamPerformance")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaUsers size={20} title="Team Performance" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("optionChain")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaSlidersH size={20} title="Option Chain" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("portfolioRisk")}
            className="p-2 rounded hover:bg-gray-700 transition"
          >
            <FaShieldAlt size={20} title="Portfolio Risk" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleLogout}
            className="p-2 rounded hover:bg-red-600 transition"
          >
            <FaSignOutAlt size={20} title="Logout" />
          </motion.button>
        </div>
      </nav>
      <motion.div
        className="p-4 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {renderTab()}
      </motion.div>
    </div>
  );
};

export default Dashboard;

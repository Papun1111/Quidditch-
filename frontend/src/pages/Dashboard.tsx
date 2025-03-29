import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaChartLine, FaPlus, FaChartArea, FaRegChartBar, FaUsers, FaSlidersH, FaShieldAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
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
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
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

  const containerClasses = darkMode
    ? "min-h-screen bg-gradient-to-r from-gray-900 to-black text-white"
    : "min-h-screen bg-gray-100 text-gray-800";

  const navClasses = darkMode
    ? "bg-gray-800 text-white p-4 flex flex-wrap justify-between items-center"
    : "bg-blue-600 text-white p-4 flex flex-wrap justify-between items-center";

  // Animation variants for buttons
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
        <div className="flex items-center gap-2">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={toggleDarkMode}
            className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition"
          >
            {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("holdings")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaWallet size={20} title="Holdings" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("positions")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaChartLine size={20} title="Positions" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("newOrder")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaPlus size={20} title="New Order" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("stockTrends")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaChartArea size={20} title="Stock Trends" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("tradingSummary")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaRegChartBar size={20} title="Trading Summary" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("teamPerformance")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaUsers size={20} title="Team Performance" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("optionChain")}
            className="p-2 rounded hover:bg-gray-500 transition"
          >
            <FaSlidersH size={20} title="Option Chain" />
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setActiveTab("portfolioRisk")}
            className="p-2 rounded hover:bg-gray-500 transition"
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
        className="p-4"
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

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';
import { motion } from 'framer-motion';
import grindot from "../assets/grindotts.jpeg";

function Login() {
  const { saveToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://zerodhaclonerepo.onrender.com/api/login", { email, password });
      saveToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-black">
      <motion.div 
        className="flex flex-col lg:flex-row justify-center items-center min-h-screen w-full px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Login Form Section */}
        <motion.div 
          className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-lg lg:w-1/2 lg:mr-8 z-10"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-3xl font-bold mb-6 text-center text-white"
            variants={itemVariants}
          >
            Welcome Back
          </motion.h2>
          
          {error && (
            <motion.div 
              className="text-red-500 mb-4 p-3 bg-red-100 bg-opacity-10 rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit}>
            <motion.div className="mb-4" variants={itemVariants}>
              <label className="block mb-2 text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 transition-all"
                required
              />
            </motion.div>
            
            <motion.div className="mb-6" variants={itemVariants}>
              <label className="block mb-2 text-white">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 transition-all"
                required
              />
            </motion.div>
            
            <motion.button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              variants={itemVariants}
            >
              Sign In
            </motion.button>
          </form>
          
          <motion.div 
            className="mt-6 text-center text-gray-400"
            variants={itemVariants}
          >
            <p>Don't have an account?{" "}
              <Link to="/signup" className="text-blue-400 hover:underline transition-colors">
                Sign Up
              </Link>
            </p>
            <p className="mt-2">
              <Link to="/forgot-password" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                Forgot your password?
              </Link>
            </p>
          </motion.div>
        </motion.div>
        
        {/* Image Section */}
        <motion.div 
          className="hidden lg:block lg:w-1/2"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="relative w-full h-full min-h-full flex justify-center items-center">
            <motion.div
              className="absolute w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{ top: '20%', left: '10%' }}
            />
            <motion.div
              className="absolute w-80 h-80 bg-purple-600 rounded-full opacity-20 blur-xl"
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{ bottom: '20%', right: '10%' }}
            />
            
            {/* Main image */}
            <motion.div 
              className="relative z-10 w-4/5 max-w-md"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src={grindot} 
                alt="Login visual" 
                className="w-full h-auto rounded-lg shadow-xl" 
              />
              
              <motion.div 
                className="absolute -top-6 -left-6 bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-lg shadow-lg"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <motion.div 
                className="absolute -bottom-4 -right-4 bg-gradient-to-tr from-cyan-400 to-blue-500 w-16 h-16 rounded-full shadow-lg"
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;

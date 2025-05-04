import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';
import { motion } from 'framer-motion';

function Signup() {
  const { saveToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Letter animation for the welcome text
  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5
      }
    })
  };

  // Split text into individual letters for animation
  const welcomeText = "Welcome to Grindotts";
  const subText = "Your journey to successful trading begins here";

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://zerodhaclonerepo.onrender.com/api/signup", { 
        username, 
        name, 
        email, 
        password 
      });
      // Auto-login after signup: store token and navigate to dashboard
      saveToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <motion.div 
      className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-r from-gray-800 to-black p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Welcome Message */}
      <motion.div
        className="w-full max-w-md mb-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ 
          opacity: 1, 
          y: 0
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-lg p-6 shadow-lg border-t-2 border-blue-400"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            {/* Animated main title with special font styling */}
            <motion.div className="mb-2 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 text-4xl" style={{ fontFamily: "Montserrat, Arial, sans-serif" }}>
              {welcomeText.split("").map((char, index) => (
                <motion.span
                  key={`welcome-${index}`}
                  custom={index}
                  variants={letterVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.div>
            
            {/* Animated subtitle */}
            <motion.p 
              className="text-xl text-white/90 italic"
              style={{ fontFamily: "Poppins, Arial, sans-serif" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              {subText}
            </motion.p>
            
            {/* Animated underline */}
            <motion.div
              className="h-1 bg-white/60 rounded-full mt-3 mx-auto"
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ delay: 1.5, duration: 0.8 }}
            />
          </div>
        </motion.div>
      </motion.div>
      
      {/* Signup Form */}
      <motion.div 
        className="w-full max-w-md p-8 bg-gray-900 rounded shadow-lg"
        initial={{ scale: 0.8, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="text-2xl font-bold mb-6 text-center text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Signup
        </motion.h2>

        {error && (
          <motion.div 
            className="text-red-500 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-white">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              required
              placeholder="Choose a username"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 text-white">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              required
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              required
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 text-white">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              required
              placeholder="Create a secure password"
            />
          </div>
          
          <motion.button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded focus:outline-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Signup
          </motion.button>
        </form>
        
        <motion.p 
          className="mt-4 text-center text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default Signup;
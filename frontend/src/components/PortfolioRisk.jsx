import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { AuthContext } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

// ─── SQUARES ANIMATION COMPONENT ────────────────────────────────────────────────
function Squares({
  direction = 'right',
  speed = 1,
  borderColor = '#999',
  squareSize = 40,
  hoverFillColor = '#222',
}) {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquare = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;
      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const sx = x - (gridOffset.current.x % squareSize);
          const sy = y - (gridOffset.current.y % squareSize);
          if (
            hoveredSquare.current &&
            Math.floor((x - startX) / squareSize) === hoveredSquare.current.x &&
            Math.floor((y - startY) / squareSize) === hoveredSquare.current.y
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(sx, sy, squareSize, squareSize);
          }
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(sx, sy, squareSize, squareSize);
        }
      }
      const grad = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, Math.hypot(canvas.width, canvas.height)/2
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, '#060606');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,canvas.width,canvas.height);
    };

    const animate = () => {
      const s = Math.max(speed, 0.1);
      switch (direction) {
        case 'right':
          gridOffset.current.x = (gridOffset.current.x - s + squareSize) % squareSize; break;
        case 'left':
          gridOffset.current.x = (gridOffset.current.x + s + squareSize) % squareSize; break;
        case 'up':
          gridOffset.current.y = (gridOffset.current.y + s + squareSize) % squareSize; break;
        case 'down':
          gridOffset.current.y = (gridOffset.current.y - s + squareSize) % squareSize; break;
        case 'diagonal':
          gridOffset.current.x = (gridOffset.current.x - s + squareSize) % squareSize;
          gridOffset.current.y = (gridOffset.current.y - s + squareSize) % squareSize;
          break;
      }
      draw();
      requestRef.current = requestAnimationFrame(animate);
    };

    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;
      hoveredSquare.current = {
        x: Math.floor((mx + gridOffset.current.x - startX) / squareSize),
        y: Math.floor((my + gridOffset.current.y - startY) / squareSize),
      };
    };
    const onMouseLeave = () => (hoveredSquare.current = null);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}

// ─── PORTFOLIO RISK COMPONENT WITH PILL TOGGLES ──────────────────────────────────
function PortfolioRisk() {
  const { token } = useContext(AuthContext);
  const [riskData, setRiskData] = useState(null);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [showRisk, setShowRisk] = useState(true);
  const [showTraj, setShowTraj] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = e => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    async function fetchRisk() {
      try {
        const res = await axios.get('https://zerodhaclonerepo.onrender.com/api/portfolio-risk', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Risk data received:', res.data);
        setRiskData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching portfolio risk');
      }
    }
    fetchRisk();
  }, [token]);

  const chartData = {
    labels: riskData?.trajectory.map((_,i) => `T${i+1}`) || [],
    datasets: [{
      label: 'Risk Trajectory',
      data: riskData?.trajectory || [],
      fill: false,
      borderColor: isDark ? 'rgba(255,99,132,1)' : 'rgba(75,192,192,1)',
      tension: 0.1,
    }],
  };

  return (
    <div className="relative min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        <Squares
          direction="diagonal"
          speed={0.5}
          borderColor={isDark ? '#444' : '#ccc'}
          squareSize={40}
          hoverFillColor={isDark ? '#222' : '#f0f0f0'}
        />
      </motion.div>

      <div className="relative z-10 p-6 flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        {error && <div className="mb-4 text-red-500">{error}</div>}

        {!riskData && !error ? (
          <div className="mb-4 text-gray-600 dark:text-gray-300">
            Loading portfolio risk data...
          </div>
        ) : (
          <>
            <motion.h2
              className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Portfolio Risk Analysis (Seeker Trajectory)
            </motion.h2>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <motion.button
                onClick={() => setShowRisk(prev => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full border transition-colors duration-300 ${
                  showRisk
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200'
                }`}
              >
                Risk Value
              </motion.button>
              <motion.button
                onClick={() => setShowTraj(prev => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full border transition-colors duration-300 ${
                  showTraj
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200'
                }`}
              >
                Trajectory
              </motion.button>
            </div>

            <AnimatePresence>
              {showRisk && riskData && (
                <motion.div
                  className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-center text-gray-700 dark:text-gray-300">
                    <strong>Current Portfolio Risk:</strong>{' '}
                    {riskData.portfolioRisk.toFixed(3)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showTraj && riskData && (
                <motion.div
                  className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <Line data={chartData} />
                </motion.div>
              )}
            </AnimatePresence>

            {!showRisk && !showTraj && (
              <motion.p
                className="text-center text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Select an option to view portfolio risk details.
              </motion.p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PortfolioRisk;

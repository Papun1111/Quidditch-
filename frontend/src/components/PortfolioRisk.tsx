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

//
// ─── SQUARES ANIMATION COMPONENT ────────────────────────────────────────────────
//
interface GridOffset {
  x: number;
  y: number;
}

interface SquaresProps {
  direction?: "diagonal" | "up" | "right" | "down" | "left";
  speed?: number;
  borderColor?: string | CanvasGradient | CanvasPattern;
  squareSize?: number;
  hoverFillColor?: string | CanvasGradient | CanvasPattern;
}

const Squares: React.FC<SquaresProps> = ({
  direction = "right",
  speed = 1,
  borderColor = "#999",
  squareSize = 40,
  hoverFillColor = "#222",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });
  const hoveredSquareRef = useRef<GridOffset | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const drawGrid = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;
      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize);
          const squareY = y - (gridOffset.current.y % squareSize);
          if (
            hoveredSquareRef.current &&
            Math.floor((x - startX) / squareSize) === hoveredSquareRef.current.x &&
            Math.floor((y - startY) / squareSize) === hoveredSquareRef.current.y
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(squareX, squareY, squareSize, squareSize);
          }
          ctx.strokeStyle = borderColor;
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        }
      }
      // Vignette gradient overlay
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "#060606");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.1);
      switch (direction) {
        case "right":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
          break;
        case "left":
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize;
          break;
        case "up":
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize;
          break;
        case "down":
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;
          break;
        case "diagonal":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize;
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;
          break;
        default:
          break;
      }
      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;
      const hoveredSquareX = Math.floor((mouseX + gridOffset.current.x - startX) / squareSize);
      const hoveredSquareY = Math.floor((mouseY + gridOffset.current.y - startY) / squareSize);
      hoveredSquareRef.current = { x: hoveredSquareX, y: hoveredSquareY };
    };

    const handleMouseLeave = () => {
      hoveredSquareRef.current = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [direction, speed, borderColor, hoverFillColor, squareSize]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

//
// ─── PORTFOLIO RISK COMPONENT WITH PILL TOGGLES ──────────────────────────────────
//
interface PortfolioRiskResponse {
  portfolioRisk: number;
  trajectory: number[];
}

const PortfolioRisk: React.FC = () => {
  const { token } = useContext(AuthContext);
  const [riskData, setRiskData] = useState<PortfolioRiskResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showRiskValue, setShowRiskValue] = useState<boolean>(true);
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);

  // Detect dark mode via matchMedia
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await axios.get<PortfolioRiskResponse>('http://localhost:3000/api/portfolio-risk', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRiskData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error fetching portfolio risk');
      }
    };
    fetchRisk();
  }, [token]);

  const data = {
    labels: riskData?.trajectory.map((_, idx) => `T${idx + 1}`) || [],
    datasets: [
      {
        label: 'Risk Trajectory',
        data: riskData?.trajectory || [],
        fill: false,
        borderColor: isDarkMode ? 'rgba(255,99,132,1)' : 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        <Squares
          direction="diagonal"
          speed={0.5}
          borderColor={isDarkMode ? "#444" : "#ccc"}
          squareSize={40}
          hoverFillColor={isDarkMode ? "#222" : "#f0f0f0"}
        />
      </motion.div>

      {/* Portfolio Risk Content */}
      <div className="relative z-10 p-6 flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <motion.h2
          className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Portfolio Risk Analysis (Seeker Trajectory)
        </motion.h2>

        {/* Pills for toggling sections */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <motion.button
            onClick={() => setShowRiskValue(prev => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full border transition-colors duration-300 ${
              showRiskValue
                ? "bg-green-500 text-white border-green-500"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200"
            }`}
          >
            Risk Value
          </motion.button>
          <motion.button
            onClick={() => setShowTrajectory(prev => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full border transition-colors duration-300 ${
              showTrajectory
                ? "bg-green-500 text-white border-green-500"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200"
            }`}
          >
            Trajectory
          </motion.button>
        </div>

        <AnimatePresence>
          {showRiskValue && (
            <motion.div
              className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-center text-gray-700 dark:text-gray-300">
                <strong>Current Portfolio Risk:</strong> {riskData?.portfolioRisk.toFixed(3)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTrajectory && (
            <motion.div
              className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Line data={data} />
            </motion.div>
          )}
        </AnimatePresence>

        {!showRiskValue && !showTrajectory && (
          <motion.p
            className="text-center text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Select an option to view portfolio risk details.
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default PortfolioRisk;

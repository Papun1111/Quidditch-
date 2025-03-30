import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import {
  motion,
  Variants,
  AnimatePresence,
  useMotionValue,
  useTransform
} from "framer-motion";
import { FaChartLine } from "react-icons/fa";

interface Position {
  _id?: string;
  symbol: string;
  companyName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  netChange: number;
  dayChangePercent: number;
  isLoss: boolean;
}

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 30
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 100
    }
  }
};

const headerVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const iconVariants: Variants = {
  hidden: {
    opacity: 0,
    rotate: -90,
    scale: 0.5
  },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10
    }
  }
};

// --- Gradient background animation ---
const gradientVariants: Variants = {
  hidden: { backgroundPosition: "0% 50%" },
  visible: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      repeat: Infinity,
      duration: 15,
      ease: "linear"
    }
  }
};

// --- Particle animation for background ---
const particleVariants = {
  animation: (i: number) => ({
    y: [0, -10, 0],
    x: [0, i % 2 === 0 ? 5 : -5, 0],
    transition: {
      duration: 2 + Math.random() * 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: Math.random() * 2
    }
  })
};

// --- 3D Card Component ---
const Card3D = ({ children, rotation = 5 }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [rotation, -rotation]);
  const rotateY = useTransform(x, [-100, 100], [-rotation, rotation]);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}
    </motion.div>
  );
};

// --- Spotlight Effect Hook ---
function useSpotlight(ref) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setPosition({ x, y });
      setOpacity(0.15);
    };

    const handleMouseLeave = () => {
      setOpacity(0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref]);

  return { position, opacity };
}

// --- Animated Number Component ---
const AnimatedNumber = ({ value, fixed = 2, prefix = "$" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime;
    let frameId;
    
    const animateValue = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 600, 1);
      
      setDisplayValue(progress * value);
      
      if (progress < 1) {
        frameId = requestAnimationFrame(animateValue);
      }
    };
    
    frameId = requestAnimationFrame(animateValue);
    
    return () => cancelAnimationFrame(frameId);
  }, [value]);
  
  return <span>{prefix}{displayValue.toFixed(fixed)}</span>;
};

// --- Sparkline Component ---
const Sparkline = ({ isLoss, delay = 0 }) => {
  // Generate deterministic sparkline path based on isLoss
  const path = isLoss
    ? "M0,10 Q20,15 40,13 T60,18 T80,15 T100,20"
    : "M0,20 Q20,15 40,10 T60,5 T80,7 T100,2";

  return (
    <div className="h-6 mt-2">
      <svg width="100%" height="100%" viewBox="0 0 100 25" preserveAspectRatio="none">
        <motion.path
          d={path}
          stroke={isLoss ? "#ef4444" : "#22c55e"}
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 1.5, delay }}
        />
      </svg>
    </div>
  );
};

const Positions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useContext(AuthContext);
  const containerRef = useRef(null);
  const spotlight = useSpotlight(containerRef);

  useEffect(() => {
    const fetchPositions = async () => {
      setIsLoading(true);
      try {
        // Simulate a delay for loading effect
        await new Promise(resolve => setTimeout(resolve, 800));
        const res = await axios.get("http://localhost:3000/api/positions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPositions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPositions();
  }, [token]);

  // Loading animation
  const loaderVariants: Variants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: 360,
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "linear" 
      }
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="min-h-screen w-full relative overflow-hidden py-10 px-4"
      initial="hidden"
      animate="visible"
      variants={gradientVariants}
      style={{
        background: "linear-gradient(-45deg, #111827, #1f2937, #312e81, #3b82f6)",
        backgroundSize: "400% 400%",
      }}
    >
      {/* Animated particles in background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.2
            }}
            custom={i}
            animate="animation"
            variants={particleVariants}
          />
        ))}
      </div>

      {/* Spotlight effect */}
      <div 
        className="absolute pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(255, 255, 255, 0.15), transparent 25%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          transform: `translate(${spotlight.position.x - 300}px, ${spotlight.position.y - 300}px)`,
          opacity: spotlight.opacity,
          transition: "opacity 0.2s ease",
        }}
      />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-center mb-10"
          variants={headerVariants}
        >
          <motion.div variants={iconVariants} className="mr-3">
            <FaChartLine className="text-white" size={36} />
          </motion.div>
          <motion.h2 
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Your Positions
          </motion.h2>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <motion.div 
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              variants={loaderVariants}
              initial="initial"
              animate="animate"
            />
            <p className="text-blue-200 mt-4">Loading your positions...</p>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            variants={containerVariants}
          >
            <AnimatePresence>
              {positions.map((position, index) => (
                <motion.div
                  key={position._id || index}
                  variants={itemVariants}
                  layout
                >
                  <Card3D>
                    <motion.div
                      className="relative p-6 rounded-2xl shadow-xl overflow-hidden"
                      style={{
                        background: "rgba(17, 24, 39, 0.8)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      {/* Background gradient accent */}
                      <div 
                        className="absolute inset-0 opacity-30 -z-10"
                        style={{
                          background: `radial-gradient(circle at ${index % 3 * 50}% ${index % 2 * 100}%, ${position.isLoss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}, transparent 70%)`
                        }}
                      />
                      
                      {/* Symbol with glow effect */}
                      <div className="relative mb-4">
                        <motion.h3 
                          className={`text-3xl font-extrabold text-white uppercase text-center ${position.isLoss ? 'text-red-50' : 'text-green-50'}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                        >
                          {position.symbol}
                        </motion.h3>
                        <div 
                          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/2 h-[2px] ${position.isLoss ? 'bg-red-500' : 'bg-green-500'} blur-sm`}
                        />
                      </div>

                      {/* Divider with animation */}
                      <motion.div 
                        className="border-b border-gray-600 mb-4"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      />
                      
                      {/* Mini chart */}
                      <Sparkline isLoss={position.isLoss} delay={0.4 + index * 0.05} />

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <motion.p 
                          className="font-semibold text-gray-300"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          Company:
                        </motion.p>
                        <motion.p 
                          className="text-gray-100"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          {position.companyName}
                        </motion.p>

                        <p className="font-semibold text-gray-300">Quantity:</p>
                        <p className="text-gray-100">{position.quantity}</p>

                        <p className="font-semibold text-gray-300">Avg. Price:</p>
                        <p className="text-gray-100">
                          <AnimatedNumber value={position.averagePrice} />
                        </p>

                        <p className="font-semibold text-gray-300">Current:</p>
                        <p className="text-gray-100">
                          <AnimatedNumber value={position.currentPrice} />
                        </p>

                        <p className="font-semibold text-gray-300">Net Change:</p>
                        <p className={position.netChange < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                          <AnimatedNumber value={position.netChange} />
                        </p>

                        <p className="font-semibold text-gray-300">Day Change:</p>
                        <p className={position.dayChangePercent < 0 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>
                          <AnimatedNumber value={position.dayChangePercent} prefix="" fixed={2} />%
                        </p>
                      </div>

                      {/* Status indicator */}
                      <motion.div
                        className={`absolute top-6 right-6 w-3 h-3 rounded-full ${position.isLoss ? 'bg-red-500' : 'bg-green-500'}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                      />
                      
                      {/* Bottom Glow Effect */}
                      <div 
                        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-[2px] ${position.isLoss ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' : 'bg-gradient-to-r from-transparent via-green-500 to-transparent'}`}
                      />
                    </motion.div>
                  </Card3D>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Positions;
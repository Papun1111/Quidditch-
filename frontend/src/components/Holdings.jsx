import React, { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import {
  motion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useTransform
} from "framer-motion";

// --- Animated Container Variants (Staggered Fade-In) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
      when: "beforeChildren"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
      when: "afterChildren"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 30, rotateX: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring", damping: 15, stiffness: 150 }
  },
  exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.3 } }
};

const floatingIconVariants = {
  hidden: { y: 0 },
  visible: {
    y: [-5, 5, -5],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
  }
};

const gradientVariants = {
  hidden: { backgroundPosition: "0% 50%" },
  visible: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: { repeat: Infinity, duration: 15, ease: "linear" }
  }
};

const textVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 100, delay: 0.2 }
  }
};

// --- Card3D Component ---
function Card3D({ children, depth = 40 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
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
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full perspective-1000"
    >
      <div style={{ transform: `translateZ(${depth}px)` }}>
        {children}
      </div>
    </motion.div>
  );
}

// --- useSpotlight Hook ---
function useSpotlight(ref) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const xPos = e.clientX - rect.left;
      const yPos = e.clientY - rect.top;
      if (
        xPos >= 0 && yPos >= 0 &&
        xPos <= rect.width && yPos <= rect.height
      ) {
        setPosition({ x: xPos, y: yPos });
        setOpacity(0.15);
      } else {
        setOpacity(0);
      }
    };
    const handleMouseLeave = () => setOpacity(0);

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
function AnimatedNumber({ value, fixed = 2 }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let startTime;
    let frameId;
    const animateValue = (timestamp) => {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 600, 1);
      setDisplayValue(progress * value);
      if (progress < 1) {
        frameId = requestAnimationFrame(animateValue);
      }
    };
    frameId = requestAnimationFrame(animateValue);
    return () => cancelAnimationFrame(frameId);
  }, [value]);
  return <span>${displayValue.toFixed(fixed)}</span>;
}

// --- Main Holdings Component ---
function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);
  const mainContainerRef = useRef(null);
  const spotlight = useSpotlight(mainContainerRef);
  const url=import.meta.env.VITE_API_URL;
  const getStableAnalytics = () => {
    const stableData = {};
    const symbols = ["AAPL","GOOGL","MSFT","AMZN","META","NFLX","TSLA","NVDA"];
    symbols.forEach((symbol) => {
      const hash = symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const isPositive = hash % 2 === 0;
      const percent = ((hash % 10) / 2).toFixed(2);
      stableData[symbol] = {
        isPositive,
        percentChange: percent,
        sparklinePath: `M0,10 Q10,${isPositive?"15":"5"} 20,${isPositive?"7":"12"} T40,${isPositive?"5":"15"} T60,${isPositive?"8":"12"} T80,${isPositive?"4":"16"} T100,${isPositive?"2":"18"}`
      };
    });
    return stableData;
  };
  const stableAnalytics = getStableAnalytics();

  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise((r) => setTimeout(r, 800));
        const res = await axios.get(`${url}/holdings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHoldings(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load holdings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHoldings();
  }, [token]);

  const renderHolding = (holding, index) => {
    const analytics = stableAnalytics[holding.symbol] || {
      isPositive: index % 2 === 0,
      percentChange: "2.50",
      sparklinePath: `M0,10 Q10,${index%2===0?"15":"5"} 20,${index%2===0?"7":"12"} T40,${index%2===0?"5":"15"} T60,${index%2===0?"8":"12"} T80,${index%2===0?"4":"16"} T100,${index%2===0?"2":"18"}`
    };

    return (
      <Card3D depth={40} key={holding.symbol}>
        <motion.div
          className="p-5 mb-4 rounded-xl shadow-xl overflow-hidden relative"
          style={{
            background: "rgba(17, 25, 40, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.125)"
          }}
          layoutId={`holding-${holding.symbol}`}
        >
          <div
            className="absolute inset-0 opacity-30 -z-10"
            style={{
              background: `radial-gradient(circle at ${(index%3)*50}% 50%, rgba(120,80,255,0.3), transparent 50%)`
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-white font-bold text-xl mr-2">
                  {holding.symbol}
                </span>
                <motion.div
                  className={`text-xs px-2 py-1 rounded-full ${
                    analytics.isPositive
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {analytics.isPositive ? "+" : "-"}
                  {analytics.percentChange}%
                </motion.div>
              </div>
              <span className="text-gray-400 text-sm mt-1">Stock</span>
            </div>
            <motion.div
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="text-white text-lg font-semibold">
                <AnimatedNumber value={holding.averagePrice} />
              </div>
              <div className="text-gray-400 text-sm mt-1">
                Qty: {holding.quantity}
              </div>
            </motion.div>
          </div>
          <div className="mt-4 h-8">
            <svg width="100%" height="100%" viewBox="0 0 100 20">
              <motion.path
                d={analytics.sparklinePath}
                fill="none"
                stroke={analytics.isPositive ? "#4ade80" : "#f87171"}
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 1.5, delay: 0.4 + index * 0.1 }}
              />
            </svg>
          </div>
        </motion.div>
      </Card3D>
    );
  };

  const loaderVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={gradientVariants}
      style={{
        background:
          "linear-gradient(-45deg, #0f172a, #1e293b, #312e81, #4f46e5)",
        backgroundSize: "400% 400%"
      }}
      ref={mainContainerRef}
    >
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, idx) => (
          <motion.div
            key={idx}
            className="absolute w-6 h-6 rounded-full bg-white opacity-10"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth]
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div
        className="absolute pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 25%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          transform: `translate(${spotlight.position.x - 300}px, ${spotlight.position.y - 300}px)`,
          opacity: spotlight.opacity,
          transition: "opacity 0.2s ease"
        }}
      />

      <motion.div className="text-center mb-10" variants={textVariants}>
        <motion.div className="inline-block mb-3" variants={floatingIconVariants}>
          <div className="text-5xl">📊</div>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Your Holdings
        </h2>
        <motion.p
          className="text-blue-200 mt-3 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5 }}
        >
          Track your investments in real-time with beautiful analytics
        </motion.p>
      </motion.div>

      <motion.div className="relative w-full max-w-2xl mx-auto" variants={containerVariants}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <motion.div
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              variants={loaderVariants}
              initial="initial"
              animate="animate"
            />
            <p className="text-blue-200 mt-4">Loading your portfolio...</p>
          </div>
        ) : error ? (
          <div
            className="p-6 text-center rounded-xl"
            style={{
              background: "rgba(15,23,42,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148,163,184,0.1)"
            }}
          >
            <p className="text-red-300">{error}</p>
          </div>
        ) : (
          <div
            className="max-h-[500px] overflow-y-auto p-6 rounded-xl relative"
            style={{
              background: "rgba(15,23,42,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148,163,184,0.1)"
            }}
          >
            <AnimatePresence>
              {holdings.map((h, i) => (
                <motion.div key={h.symbol} variants={itemVariants} custom={i}>
                  {renderHolding(h, i)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Holdings;

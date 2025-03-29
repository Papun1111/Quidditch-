import React, { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { motion, useInView } from "framer-motion";

// --- Animated Item Component ---
interface AnimatedItemProps {
  children: React.ReactNode;
  delay?: number;
  index: number;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3, delay }}
      className="w-full mb-3"
    >
      {children}
    </motion.div>
  );
};

// --- Animated List Component ---
interface AnimatedListProps<T> {
  items: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
}

const AnimatedList = <T,>({ items, renderItem }: AnimatedListProps<T>) => {
  return (
    <div className="relative w-full">
      <div className="max-h-[400px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
        {items.map((item, index) => (
          <AnimatedItem key={index} delay={0.1} index={index}>
            {renderItem ? renderItem(item, index) : <div className="p-4 bg-gray-800 rounded-lg">{item as any}</div>}
          </AnimatedItem>
        ))}
      </div>
    </div>
  );
};

// --- Holdings Component ---
const Holdings: React.FC = () => {
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number; averagePrice: number }[]>([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/holdings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHoldings(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHoldings();
  }, [token]);

  // Render function for a single holding
  const renderHolding = (holding: any, index: number) => (
    <div className="w-full p-4 bg-gray-900 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-800">
      <div className="flex justify-between items-center w-full">
        <span className="text-white font-semibold">{holding.symbol}</span>
        <span className="text-white">Qty: {holding.quantity}</span>
        <span className="text-white">Avg: ${holding.averagePrice}</span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 flex flex-col items-center w-full">
      {/* Header Animation with Center Alignment */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl font-bold text-white mb-6 text-center w-full"
      >
        📊 Your Holdings
      </motion.h2>

      {/* Animated List Component */}
      <AnimatedList items={holdings} renderItem={renderHolding} />
    </div>
  );
};

export default Holdings;

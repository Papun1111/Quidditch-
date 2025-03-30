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

const AnimatedItem: React.FC<AnimatedItemProps> = ({
  children,
  delay = 0,
  index,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3, delay }}
      className="w-full mb-4"
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
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="max-h-[400px] overflow-y-auto p-4 rounded-lg border border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {items.map((item, index) => (
          <AnimatedItem key={index} delay={0.1} index={index}>
            {renderItem ? (
              renderItem(item, index)
            ) : (
              <div className="p-4 bg-gray-800 rounded-lg text-white">
                {item as any}
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
    </div>
  );
};

// --- Holdings Component ---
const Holdings: React.FC = () => {
  const [holdings, setHoldings] = useState<
    { symbol: string; quantity: number; averagePrice: number }[]
  >([]);
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
  const renderHolding = (
    holding: { symbol: string; quantity: number; averagePrice: number },
    index: number
  ) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-4 bg-gray-900 rounded-lg shadow-md flex items-center justify-between 
                 transition-transform duration-200 hover:bg-gray-800"
    >
      <span className="text-white font-semibold text-lg">{holding.symbol}</span>
      <div className="flex flex-col items-end space-y-1">
        <span className="text-white text-sm">Qty: {holding.quantity}</span>
        {/* Format average price to 2 decimals */}
        <span className="text-white text-sm">
          Avg: ${holding.averagePrice.toFixed(2)}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto p-6 flex flex-col items-center w-full">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-3xl font-bold text-white mb-6 text-center"
      >
        📊 Your Holdings
      </motion.h2>

      <AnimatedList items={holdings} renderItem={renderHolding} />
    </div>
  );
};

export default Holdings;

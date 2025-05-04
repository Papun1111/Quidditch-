import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaChartLine } from 'react-icons/fa';

function DecryptedText({
  text,
  speed = 100,
  maxIterations = 20,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  encryptedClassName = '',
  parentClassName = '',
  animateOn = 'hover',
  ...props
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    let interval;
    let currentIteration = 0;

    const getNextIndex = revealedSet => {
      const length = text.length;
      if (revealDirection === 'end') {
        return length - 1 - revealedSet.size;
      }
      if (revealDirection === 'center') {
        const middle = Math.floor(length / 2);
        const offset = Math.floor(revealedSet.size / 2);
        const next = revealedSet.size % 2 === 0
          ? middle + offset
          : middle - offset - 1;
        if (next >= 0 && next < length && !revealedSet.has(next)) return next;
        for (let i = 0; i < length; i++) {
          if (!revealedSet.has(i)) return i;
        }
        return 0;
      }
      // 'start' or default
      return revealedSet.size;
    };

    const availableChars = useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter(c => c !== ' ')
      : characters.split('');

    const shuffleText = (orig, revealed) => {
      if (useOriginalCharsOnly) {
        const positions = orig.split('').map((c, i) => ({
          char: c,
          isSpace: c === ' ',
          index: i,
          isRevealed: revealed.has(i),
        }));
        const pool = positions
          .filter(p => !p.isSpace && !p.isRevealed)
          .map(p => p.char);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        let pi = 0;
        return positions
          .map(p => {
            if (p.isSpace) return ' ';
            if (p.isRevealed) return orig[p.index];
            return pool[pi++];
          })
          .join('');
      } else {
        return orig
          .split('')
          .map((c, i) => {
            if (c === ' ') return ' ';
            if (revealed.has(i)) return orig[i];
            return availableChars[Math.floor(Math.random() * availableChars.length)];
          })
          .join('');
      }
    };

    if (isHovering) {
      setIsScrambling(true);
      interval = window.setInterval(() => {
        setRevealedIndices(prev => {
          if (sequential) {
            if (prev.size < text.length) {
              const next = getNextIndex(prev);
              const nxtSet = new Set(prev);
              nxtSet.add(next);
              setDisplayText(shuffleText(text, nxtSet));
              return nxtSet;
            }
            clearInterval(interval);
            setIsScrambling(false);
            return prev;
          } else {
            setDisplayText(shuffleText(text, prev));
            currentIteration++;
            if (currentIteration >= maxIterations) {
              clearInterval(interval);
              setIsScrambling(false);
              setDisplayText(text);
            }
            return prev;
          }
        });
      }, speed);
    } else {
      setDisplayText(text);
      setRevealedIndices(new Set());
      setIsScrambling(false);
    }

    return () => clearInterval(interval);
  }, [
    isHovering,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    characters,
    useOriginalCharsOnly,
    animateOn,
  ]);

  useEffect(() => {
    if (animateOn !== 'view') return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsHovering(true);
          setHasAnimated(true);
        }
      });
    }, { threshold: 0.1 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => {
      if (containerRef.current) obs.unobserve(containerRef.current);
    };
  }, [animateOn, hasAnimated]);

  const hoverProps = animateOn === 'hover'
    ? { onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false) }
    : {};

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      {...hoverProps}
      {...props}
    >
      <span className="sr-only">{displayText}</span>
      <span aria-hidden="true">
        {displayText.split('').map((char, idx) => {
          const done = revealedIndices.has(idx) || !isScrambling || !isHovering;
          return (
            <span key={idx} className={done ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}

function getTeamGradient(index) {
  const hue = (index * 137) % 360;
  return {
    background: `linear-gradient(
      90deg,
      hsl(${hue}, 70%, 60%),
      hsl(${(hue + 30) % 360}, 70%, 60%)
    )`,
  };
}

function TeamPerformanceComponent() {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const url=import.meta.env.VITE_API_URL;
  useEffect(() => {
    async function fetchPerformance() {
      try {
        const res = await axios.get(`${url}/team-performance`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching team performance');
      }
    }
    fetchPerformance();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 min-h-screen">
      <motion.h2
        className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white flex justify-center items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FaUsers className="inline-block mr-2" /> Team Performance
      </motion.h2>

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-red-500 text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        className="overflow-x-auto max-w-5xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { when: 'beforeChildren', staggerChildren: 0.05 } },
        }}
      >
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                Team
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                Symbol
              </th>
              <th className="py-3 px-4 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                Performance (%) <FaChartLine className="inline-block ml-1" />
              </th>
            </tr>
          </thead>
          <AnimatePresence>
            <tbody>
              {data.map((item, idx) => (
                <motion.tr
                  key={item.team + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-3 px-4 border-t border-gray-200 dark:border-gray-600">
                    <div style={getTeamGradient(idx)} className="p-2 rounded flex items-center justify-center">
                      <DecryptedText
                        text={item.team}
                        animateOn="view"
                        speed={120}
                        maxIterations={18}
                        className="text-white font-bold"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                    {item.symbol}
                  </td>
                  <td
                    className="py-3 px-4 border-t border-gray-200 dark:border-gray-600"
                    style={{ color: item.performance >= 0 ? 'green' : 'red' }}
                  >
                    {item.performance.toFixed(2)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </AnimatePresence>
        </table>
      </motion.div>
    </div>
  );
}

export default TeamPerformanceComponent;

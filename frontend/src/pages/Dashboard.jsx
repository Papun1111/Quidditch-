import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaWallet,
  FaSignOutAlt,
} from "react-icons/fa";

import Holdings from "../components/Holdings";
import Positions from "../components/Positions";
import OrderForm from "../components/OrderForm";
import StockTrends from "../components/StockTrends";
import TeamPerformance from "../components/TeamPerformance";
import OptionChain from "../components/OptionChain";
import PortfolioRisk from "../components/PortfolioRisk";
import VRTradingPit from "../components/VRTradingPit";
import { AuthContext } from "../components/AuthContext";

// -------------- GooeyNav Code --------------
const GooeyNav = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  activeIndex,
  onChangeIndex,
}) => {
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const filterRef = useRef(null);
  const textRef = useRef(null);

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance, pointIndex, totalPoints) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i, t, d, r) => {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = useCallback((element) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove("active");

      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
        particle.style.setProperty("--rotate", `${p.rotate}deg`);

        point.classList.add("point");
        particle.appendChild(point);
        element.appendChild(particle);

        requestAnimationFrame(() => {
          element.classList.add("active");
        });

        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {}
        }, t);
      }, 30);
    }
  }, [
    animationTime,
    particleCount,
    particleDistances,
    particleR,
    timeVariance,
    colors,
  ]);

  const updateEffectPosition = useCallback((element) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };

    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  }, []);

  const handleClick = (e, index) => {
    if (activeIndex === index) return;
    onChangeIndex(index);

    const liEl = e.currentTarget;
    updateEffectPosition(liEl);

    // Clear out any existing particles
    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(".particle");
      particles.forEach((p) => filterRef.current.removeChild(p));
    }

    if (textRef.current) {
      textRef.current.classList.remove("active");
      // force reflow
      void textRef.current.offsetWidth;
      textRef.current.classList.add("active");
    }

    if (filterRef.current) {
      makeParticles(filterRef.current);
    }
  };

  // For accessibility (keyboard nav)
  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const liEl = e.currentTarget.parentElement;
      if (liEl) handleClick({ currentTarget: liEl }, index);
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const liElements = navRef.current.querySelectorAll("li");
    const currentActiveLi = liElements[activeIndex];

    if (currentActiveLi) {
      updateEffectPosition(currentActiveLi);
      textRef.current?.classList.add("active");
    }

    // Reposition on container resize
    const resizeObserver = new ResizeObserver(() => {
      const liElements2 = navRef.current?.querySelectorAll("li");
      if (liElements2 && liElements2[activeIndex]) {
        updateEffectPosition(liElements2[activeIndex]);
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [activeIndex, updateEffectPosition]);

  return (
    <>
      {/* Gooey Effect Styles */}
      <style>
        {`
          :root {
            --linear-ease: linear(0, 0.068, 0.19 2.7%, 0.804 8.1%, 1.037, 1.199 13.2%, 1.245, 1.27 15.8%, 1.274, 1.272 17.4%, 1.249 19.1%, 0.996 28%, 0.949, 0.928 33.3%, 0.926, 0.933 36.8%, 1.001 45.6%, 1.013, 1.019 50.8%, 1.018 54.4%, 1 63.1%, 0.995 68%, 1.001 85%, 1);
          }
          .effect {
            position: absolute;
            opacity: 1;
            pointer-events: none;
            display: grid;
            place-items: center;
            z-index: 1;
          }
          .effect.text {
            color: white;
            transition: color 0.3s ease;
          }
          .effect.text.active {
            color: black;
          }
          .effect.filter {
            filter: blur(7px) contrast(100) blur(0);
            mix-blend-mode: lighten;
          }
          .effect.filter::before {
            content: "";
            position: absolute;
            inset: -75px;
            z-index: -2;
            background: black;
          }
          .effect.filter::after {
            content: "";
            position: absolute;
            inset: 0;
            background: white;
            transform: scale(0);
            opacity: 0;
            z-index: -1;
            border-radius: 9999px;
          }
          .effect.filter.active::after {
            animation: pill 0.3s ease both;
          }
          @keyframes pill {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .particle,
          .point {
            display: block;
            opacity: 0;
            width: 20px;
            height: 20px;
            border-radius: 9999px;
            transform-origin: center;
          }
          .particle {
            --time: 5s;
            position: absolute;
            top: calc(50% - 8px);
            left: calc(50% - 8px);
            animation: particle calc(var(--time)) ease 1 -350ms;
          }
          .point {
            background: var(--color);
            opacity: 1;
            animation: point calc(var(--time)) ease 1 -350ms;
          }
          @keyframes particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }
          @keyframes point {
            0% {
              transform: scale(0);
              opacity: 0;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            25% {
              transform: scale(calc(var(--scale) * 0.25));
            }
            38% {
              opacity: 1;
            }
            65% {
              transform: scale(var(--scale));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: scale(var(--scale));
              opacity: 1;
            }
            100% {
              transform: scale(0);
              opacity: 0;
            }
          }
          ul li.active {
            color: black;
            text-shadow: none;
          }
          ul li.active::after {
            opacity: 1;
            transform: scale(1);
          }
          ul li::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 8px;
            background: white;
            opacity: 0;
            transform: scale(0);
            transition: all 0.3s ease;
            z-index: -1;
          }
        `}
      </style>

      <div className="relative" ref={containerRef}>
        <nav
          className="flex flex-col gap-4 relative"
          style={{ transform: "translate3d(0,0,0.01px)" }}
        >
          <ul
            ref={navRef}
            className="flex flex-col gap-4 list-none p-0 m-0 relative z-[3]"
            style={{
              color: "white",
              textShadow: "0 1px 1px hsl(205deg 30% 10% / 0.2)",
            }}
          >
            {items.map((item, index) => (
              <li
                key={index}
                className={`py-2 px-4 rounded relative cursor-pointer transition duration-300 ease hover:bg-gray-700 ${
                  activeIndex === index ? "bg-gray-800 active" : ""
                }`}
                onClick={(e) => handleClick(e, index)}
              >
                <a
                  href={item.href}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="outline-none"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* The Gooey highlight and text overlays */}
        <span className="effect filter" ref={filterRef} />
        <span className="effect text" ref={textRef} />
      </div>
    </>
  );
};

// -------------- Dashboard Code --------------
const Dashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Which tab is active, e.g. "holdings"
  const [activeTab, setActiveTab] = useState("holdings");
  // Mobile sidebar open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Our nav items
  const navItems = [
    { label: "Holdings", href: "#holdings" },
    { label: "Positions", href: "#positions" },
    { label: "New Order", href: "#newOrder" },
    { label: "Stock Trends", href: "#stockTrends" },
    { label: "Team Performance", href: "#teamPerformance" },
    { label: "Option Chain", href: "#optionChain" },
    { label: "Portfolio Risk", href: "#portfolioRisk" },
    { label: "VR Trading Pit", href: "#vrtradingpt" },
  ];

  // Update activeTab when URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location;
      if (hash) {
        setActiveTab(hash.slice(1)); // remove '#'
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    // Check at mount
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Determine activeIndex from activeTab
  const activeIndex = navItems.findIndex((item) => item.href.slice(1) === activeTab);
  // If not found, default to 0
  const computedActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // When GooeyNav changes index, we set the hash
  const handleChangeIndex = (index) => {
    const newHref = navItems[index].href;
    window.location.hash = newHref;
  };

  // Decide which content to render
  const renderTabContent = () => {
    switch (activeTab) {
      case "holdings":
        return <Holdings />;
      case "positions":
        return <Positions />;
      case "newOrder":
        return <OrderForm />;
      case "stockTrends":
        return <StockTrends />;
      case "teamPerformance":
        return <TeamPerformance />;
      case "optionChain":
        return <OptionChain />;
      case "portfolioRisk":
        return <PortfolioRisk />;
      case "vrtradingpt":
        return <VRTradingPit />;
      default:
        return <Holdings />;
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Sidebar variants for small-screen slide-in
  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      {/* -- TOP NAVBAR for small screens -- */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center">
          <FaWallet className="text-xl mr-2" />
          <span className="font-bold text-lg">Quidditch Dashboard</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="focus:outline-none"
          aria-label="Open menu"
        >
          <FaBars className="text-2xl" />
        </button>
      </div>

      {/* -- MAIN LAYOUT: SIDEBAR (MD+) + CONTENT -- */}
      <div className="flex flex-1">
        {/* Sidebar: Always visible on md+ */}
        <div className="hidden md:flex md:flex-col w-60 bg-gray-900">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center">
              <FaWallet className="text-xl mr-2" />
              <span className="font-bold text-lg whitespace-nowrap">Dashboard</span>
            </div>
          </div>

          {/* Our GooeyNav inside the sidebar */}
          <div className="mt-4 px-2 flex-1">
            <GooeyNav
              items={navItems}
              activeIndex={computedActiveIndex}
              onChangeIndex={handleChangeIndex}
            />
          </div>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* MOBILE SIDEBAR with framer-motion (md:hidden) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.aside
              key="mobileSidebar"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={sidebarVariants}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center">
                  <FaWallet className="text-xl mr-2" />
                  <span className="font-bold text-lg">Dashboard</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="focus:outline-none"
                  aria-label="Close menu"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* GooeyNav for mobile */}
              <div className="mt-4 px-2 flex-1">
                <GooeyNav
                  items={navItems}
                  activeIndex={computedActiveIndex}
                  onChangeIndex={(index) => {
                    handleChangeIndex(index);
                    setMobileMenuOpen(false);
                  }}
                />
              </div>

              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderTabContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
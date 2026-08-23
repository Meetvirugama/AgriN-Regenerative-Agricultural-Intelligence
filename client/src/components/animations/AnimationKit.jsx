/**
 * PageTransition — Wraps page content with a smooth fade + slide-up animation.
 * AnimatedList   — Renders children with staggered entrance animations.
 * CountUp        — Animates a number from 0 to its target value.
 *
 * Uses framer-motion which is already installed.
 */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

// ─── Page Transition Wrapper ─────────────────────────────────────────────────
// Wrap any page's top-level JSX with <PageTransition> for fade+slide entrance.
export const PageTransition = ({ children, className = "" }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={className}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Staggered Card Container ────────────────────────────────────────────────
// Wraps a list of items with staggered entrance.
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export const StaggerContainer = ({ children, className = "", ...props }) => (
  <motion.div
    className={className}
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = "", ...props }) => (
  <motion.div
    className={className}
    variants={itemVariants}
    {...props}
  >
    {children}
  </motion.div>
);

// ─── Fade-In Section ─────────────────────────────────────────────────────────
// Simple fade + slide-up for individual sections (headers, banners, etc.)
export const FadeIn = ({ children, delay = 0, className = "", direction = "up", ...props }) => {
  const directionMap = {
    up: { y: 16 },
    down: { y: -16 },
    left: { x: 16 },
    right: { x: -16 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ─── Count Up Number ─────────────────────────────────────────────────────────
// Animates a number from 0 to `end` over `duration` ms.
export const CountUp = ({ end, duration = 1200, decimals = 0, prefix = "", suffix = "" }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (end === 0 || end == null) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    let rafId;

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * end);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ─── Scale Pop (for diagnosis result reveal) ─────────────────────────────────
export const ScalePop = ({ children, className = "", delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.4,
      delay,
      ease: [0.34, 1.56, 0.64, 1], // Spring-like overshoot
    }}
  >
    {children}
  </motion.div>
);

// ─── Press Scale (for buttons) ───────────────────────────────────────────────
export const PressableButton = ({ children, className = "", onClick, disabled, ...props }) => (
  <motion.button
    className={className}
    onClick={onClick}
    disabled={disabled}
    whileTap={{ scale: 0.96 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.1 }}
    {...props}
  >
    {children}
  </motion.button>
);

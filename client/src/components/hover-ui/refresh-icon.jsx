import { forwardRef, useImperativeHandle , useEffect } from "react";

import { motion, useAnimate } from "framer-motion";
import "./hover-icon.css";

const RefreshIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "", isHovered = false },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = async () => {
      await animate(
        scope.current,
        { rotate: 180 },
        { duration: 0.4, ease: "easeInOut" },
      );
    };

    const stop = async () => {
      await animate(
        scope.current,
        { rotate: 0 },
        { duration: 0.4, ease: "easeInOut" },
      );
    };

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    useEffect(() => {
      if (isHovered) {
        start();
      } else {
        stop();
      }
    }, [isHovered, start, stop]);

    const handleHoverStart = () => {
      start();
    };

    const handleHoverEnd = () => {
      stop();
    };

    return (
      <motion.svg
        ref={scope}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`hover-icon-wrapper ${className}`}
        style={{ transformOrigin: "50% 50%" }}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
      </motion.svg>
    );
  },
);

RefreshIcon.displayName = "RefreshIcon";

export default RefreshIcon;

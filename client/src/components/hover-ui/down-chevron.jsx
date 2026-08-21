import { forwardRef, useImperativeHandle, useCallback , useEffect } from "react";

import { motion, useAnimate } from "framer-motion";
import "./hover-icon.css";

const DownChevron = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "", isHovered = false },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      await animate(
        ".chevron-down",
        {
          y: [0, 6, 0],
        },
        {
          duration: 0.8,
          ease: "easeInOut",
        },
      );
    }, [animate]);

    const stop = useCallback(() => {
      animate(".chevron-down", { y: 0 }, { duration: 0.2, ease: "easeInOut" });
    }, [animate]);

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

    return (
      <motion.div
        ref={scope}
        className={`hover-icon-wrapper ${className}`}
        onHoverStart={start}
        onHoverEnd={stop}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chevron-down"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </motion.div>
    );
  },
);

DownChevron.displayName = "DownChevron";
export default DownChevron;

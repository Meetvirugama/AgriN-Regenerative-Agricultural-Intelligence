import { forwardRef, useImperativeHandle, useCallback , useEffect } from "react";

import { motion, useAnimate } from "framer-motion";
import "./hover-icon.css";

const UserIcon = forwardRef(
  (
    { size = 24, color = "currentColor", strokeWidth = 2, className = "", isHovered = false },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      animate(
        ".user-avatar",
        {
          scale: 1.05,
          y: -1,
        },
        {
          duration: 0.25,
          ease: "easeOut",
        },
      );
    }, [animate]);

    const stop = useCallback(async () => {
      animate(
        ".user-avatar",
        {
          scale: 1,
          y: 0,
        },
        {
          duration: 0.2,
          ease: "easeInOut",
        },
      );
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
      <motion.svg
        ref={scope}
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
        onHoverStart={start}
        onHoverEnd={stop}
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <motion.g
          className="user-avatar"
          style={{ transformOrigin: "50% 50%" }}
        >
          <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
          <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
        </motion.g>
      </motion.svg>
    );
  },
);

UserIcon.displayName = "UserIcon";
export default UserIcon;

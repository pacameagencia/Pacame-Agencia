'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FancyTextProps {
  children: string;
  className?: string;
  fillClassName?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
}

const FancyText = React.forwardRef<HTMLSpanElement, FancyTextProps>(
  (
    {
      children,
      className = 'text-5xl font-black leading-none text-white/10',
      fillClassName = 'text-white',
      stagger = 0.06,
      duration = 1.2,
      delay = 0,
      once = true,
    },
    ref,
  ) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    const finalRef = (ref ?? spanRef) as React.RefObject<HTMLSpanElement>;

    const chars = children.split('');
    const [hideBase, setHideBase] = useState(false);
    const [isSmall, setIsSmall] = useState(false);

    useLayoutEffect(() => {
      if (!finalRef.current) return;
      const size = parseFloat(getComputedStyle(finalRef.current).fontSize);
      setIsSmall(size < 28);
    }, [finalRef]);

    return (
      <motion.span
        ref={finalRef}
        className="relative inline-block"
        initial="hidden"
        whileInView="visible"
        viewport={{ once }}
      >
        {/* Base ghost text */}
        <span
          className={cn(className)}
          style={{ opacity: hideBase && isSmall ? 0 : 1 }}
        >
          {children}
        </span>

        {/* Animated fill overlay */}
        <span className="absolute inset-0 flex overflow-hidden">
          {chars.map((char, i) => (
            <motion.span
              key={i}
              className={cn(className, fillClassName)}
              variants={{
                hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
                visible: {
                  clipPath: 'inset(0% 0% 0% 0%)',
                  transition: {
                    duration,
                    delay: delay + i * stagger,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                },
              }}
              onAnimationComplete={() => {
                if (i === chars.length - 1 && isSmall) setHideBase(true);
              }}
              style={{
                display: 'inline-block',
                whiteSpace: char === ' ' ? 'pre' : 'normal',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </span>
      </motion.span>
    );
  },
);

FancyText.displayName = 'FancyText';
export { FancyText };

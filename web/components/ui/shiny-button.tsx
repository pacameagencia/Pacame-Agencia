'use client';

import * as React from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ShinyButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientOpacity?: number;
  gradientAngle?: number;
}

export const ShinyButton = React.forwardRef<HTMLDivElement, ShinyButtonProps>(
  (
    {
      className,
      children,
      gradientFrom = '#E8B730',
      gradientTo = '#B54E30',
      gradientOpacity = 0.7,
      gradientAngle = 0,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [currentAngle, setCurrentAngle] = React.useState(gradientAngle);
    const [isTouch, setIsTouch] = React.useState(false);
    const angle = useMotionValue(gradientAngle);

    const reset = React.useCallback(() => {
      angle.set(gradientAngle);
      setCurrentAngle(gradientAngle);
      setIsHovered(false);
    }, [angle, gradientAngle]);

    const handlePointerMove = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'touch') {
          setIsTouch(true);
          return;
        }
        setIsTouch(false);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = x - rect.width / 2;
        const dy = y - rect.height / 2;
        const radians = Math.atan2(dy, dx);
        const deg = (radians * 180) / Math.PI;
        angle.set(deg);
        setCurrentAngle(deg);
      },
      [angle],
    );

    React.useEffect(() => {
      reset();
    }, [reset]);

    const gradientStyle = React.useMemo(
      () => ({
        background: `linear-gradient(${currentAngle}deg, ${gradientFrom}, ${gradientTo} 30%, transparent 80%)`,
        opacity: gradientOpacity,
      }),
      [currentAngle, gradientFrom, gradientTo, gradientOpacity],
    );

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full text-sm font-medium',
          className,
        )}
        onPointerEnter={() => setIsHovered(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        {...props}
      >
        {/* Rotating gradient border */}
        {isTouch ? (
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              background: `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo} 30%, transparent 80%)`,
              opacity: gradientOpacity,
            }}
          />
        ) : (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={gradientStyle}
            animate={{ opacity: gradientOpacity }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 20,
              mass: 0.5,
            }}
          />
        )}

        {/* Inner background */}
        <div className="absolute inset-px rounded-[inherit] bg-[#141414]" />

        {/* Hover glow layer */}
        <div
          className={cn(
            'absolute inset-px rounded-[inherit] bg-white/[0.04] transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}
        />

        {/* Content — rendered directly, no Slot */}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {children}
        </div>
      </div>
    );
  },
);
ShinyButton.displayName = 'ShinyButton';

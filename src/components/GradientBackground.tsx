import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  colors?: string[];
  ambientGlow?: boolean;
  showNoise?: boolean;
  interactive?: boolean;
}

export const DEFAULT_WARM_BEIGE_COLORS = [
  '#FFFFFF', // Bright pure highlight
  '#FAF6F0', // Light warm ivory base
  '#F6EFE5', // Very soft oat cream
  '#FAF3EA', // Delicate vanilla glow
  '#F3E7DA', // Ultra-subtle warm accent
];

export function GradientBackground({
  children,
  className = '',
  colors = DEFAULT_WARM_BEIGE_COLORS,
  ambientGlow = true,
  showNoise = true,
  interactive = true,
}: GradientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - 192);
        mouseY.set(e.clientY - rect.top - 192);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen w-full bg-[#FAF6F0] overflow-hidden ${className}`}
    >
      {/* Background Layer (Fixed / Absolute Ambient Glow) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Base Gradient Fill - Light & Luminous */}
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${colors[0]} 0%, #FAF6F0 50%, #F5EDE2 100%)`,
          }}
        />

        {/* Animated Floating Gradient Orbs */}
        {ambientGlow && (
          <>
            {/* Top-Left Soft Highlight Blob */}
            <motion.div
              className="absolute -top-20 -left-20 w-[30rem] h-[30rem] sm:w-[45rem] sm:h-[45rem] rounded-full blur-3xl opacity-35 will-change-transform"
              style={{
                background: `radial-gradient(circle, ${colors[1]} 0%, ${colors[2]} 60%, transparent 100%)`,
              }}
              animate={{
                x: [0, 40, -20, 0],
                y: [0, -30, 30, 0],
                scale: [1, 1.1, 0.95, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Top-Right Light Vanilla Whisper Blob */}
            <motion.div
              className="absolute -top-10 -right-20 w-[28rem] h-[28rem] sm:w-[40rem] sm:h-[40rem] rounded-full blur-3xl opacity-30 will-change-transform"
              style={{
                background: `radial-gradient(circle, ${colors[4]} 0%, ${colors[3]} 70%, transparent 100%)`,
              }}
              animate={{
                x: [0, -50, 20, 0],
                y: [0, 40, -20, 0],
                scale: [1, 0.9, 1.08, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Center-Bottom Luminous Cream Blob */}
            <motion.div
              className="absolute bottom-[-10%] left-[20%] w-[32rem] h-[32rem] sm:w-[50rem] sm:h-[50rem] rounded-full blur-3xl opacity-30 will-change-transform"
              style={{
                background: `radial-gradient(circle, ${colors[2]} 0%, ${colors[0]} 80%, transparent 100%)`,
              }}
              animate={{
                x: [0, 30, -30, 0],
                y: [0, -40, 20, 0],
                scale: [1, 1.05, 0.9, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}

        {/* Interactive Mouse Hover Glow */}
        {interactive && (
          <motion.div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none will-change-transform"
            style={{
              background: `radial-gradient(circle, #F3E6D5 0%, rgba(250, 246, 240, 0) 70%)`,
              x: mouseX,
              y: mouseY,
            }}
          />
        )}

        {/* Repeating Fork & Spoon Culinary Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cg fill='none' stroke='%239E4624' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 10v8M19 10v8M22 10v8M16 18c0 3 6 3 6 0M19 20.5v15.5'/%3E%3Cpath d='M32 10c-3.5 0-5 4.5-5 8 0 3.5 2 4.5 5 4.5s5-1 5-4.5c0-3.5-1.5-8-5-8zM32 22.5v13.5'/%3E%3Cpath d='M52 46v8M55 46v8M58 46v8M52 54c0 3 6 3 6 0M55 56.5v15.5'/%3E%3Cpath d='M68 46c-3.5 0-5 4.5-5 8 0 3.5 2 4.5 5 4.5s5-1 5-4.5c0-3.5-1.5-8-5-8zM68 58.5v13.5'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Grainy Texture Layer */}
        {showNoise && (
          <div
            className="absolute inset-0 opacity-[0.06] mix-blend-multiply pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}

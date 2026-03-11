import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface BackgroundLayoutProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
}

const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

export const BackgroundLayout: React.FC<BackgroundLayoutProps> = ({
  children,
  isDarkMode = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pointerQuery = window.matchMedia('(pointer: coarse)');
    const syncPointer = () => setIsCoarsePointer(pointerQuery.matches);
    syncPointer();
    pointerQuery.addEventListener?.('change', syncPointer);

    return () => {
      pointerQuery.removeEventListener?.('change', syncPointer);
    };
  }, []);

  const shouldAnimate = !prefersReducedMotion && !isCoarsePointer;

  return (
    <div
      className={`relative w-full overflow-hidden transition-colors duration-700 ${
        isDarkMode ? 'bg-base-dark text-white' : 'bg-base-light text-slate-800'
      }`}
      style={{ height: 'calc(var(--app-vh, 1vh) * 100)' }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-40' : 'opacity-100'}`}>
          <motion.div
            animate={
              shouldAnimate
                ? { scale: [1, 1.08, 1], rotate: [0, 18, 0], x: [0, 36, 0] }
                : undefined
            }
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-[10%] -left-[12%] h-[58%] w-[72%] rounded-full bg-gradient-to-r from-pink-200/70 to-orange-100/60 blur-[52px]"
          />
          <motion.div
            animate={
              shouldAnimate
                ? { scale: [1, 1.06, 1], x: [0, -24, 0], y: [0, 42, 0] }
                : undefined
            }
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute right-[-10%] top-[8%] h-[52%] w-[58%] rounded-full bg-gradient-to-b from-sky-200/60 to-indigo-100/60 blur-[50px]"
          />
          <motion.div
            animate={shouldAnimate ? { scale: [1, 1.1, 1], y: [0, -28, 0] } : undefined}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute bottom-[-8%] left-[10%] h-[44%] w-[76%] rounded-full bg-gradient-to-t from-emerald-200/45 to-cyan-100/35 blur-[54px]"
          />
        </div>

        {isDarkMode && (
          <div className="absolute inset-0 z-0">
            <div className="absolute left-1/4 top-1/4 h-1 w-1 rounded-full bg-white/70 animate-pulse" />
            <div className="absolute right-1/3 top-3/4 h-0.5 w-0.5 rounded-full bg-white/50 animate-pulse" />
            <div className="absolute left-2/3 top-1/3 h-0.5 w-0.5 rounded-full bg-white/40" />
          </div>
        )}

        <div
          className="absolute inset-0 mix-blend-overlay opacity-[0.03]"
          style={{ backgroundImage: NOISE_TEXTURE }}
        />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col">{children}</div>
    </div>
  );
};

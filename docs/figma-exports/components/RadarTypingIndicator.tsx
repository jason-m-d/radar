import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export function RadarTypingIndicator() {
  const [visibleDots, setVisibleDots] = useState(0);
  const [phase, setPhase] = useState<'expanding' | 'morphing'>('expanding');

  useEffect(() => {
    let timeoutId: number;

    if (phase === 'expanding') {
      if (visibleDots < 4) {
        // Show next dot after 300ms
        timeoutId = window.setTimeout(() => {
          setVisibleDots(prev => prev + 1);
        }, 300);
      } else {
        // All dots visible, wait 300ms then start morphing
        timeoutId = window.setTimeout(() => {
          setPhase('morphing');
        }, 300);
      }
    } else if (phase === 'morphing') {
      // Morph back to 1 dot over 600ms, then restart
      timeoutId = window.setTimeout(() => {
        setVisibleDots(0);
        setPhase('expanding');
      }, 600);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visibleDots, phase]);

  const dotSizes = [10, 8, 6, 4]; // Smaller sizes from largest to smallest
  const glowColor = 'rgba(233, 138, 21, 0.6)'; // More subtle color

  return (
    <div className="flex items-center gap-1.5 py-2">
      <AnimatePresence mode="sync">
        {phase === 'expanding' && (
          <>
            {Array.from({ length: 4 }).map((_, index) => {
              const isVisible = index < visibleDots;
              const size = dotSizes[index];
              
              return (
                <motion.div
                  key={`dot-${index}`}
                  initial={{ scale: 0, opacity: 0, filter: 'blur(4px)' }}
                  animate={
                    isVisible
                      ? { 
                          scale: 1, 
                          opacity: 0.8,
                          filter: 'blur(0px)'
                        }
                      : { 
                          scale: 0, 
                          opacity: 0,
                          filter: 'blur(4px)'
                        }
                  }
                  exit={{ 
                    scale: 0, 
                    opacity: 0,
                    filter: 'blur(4px)'
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1], // More elastic, liquid ease
                    opacity: { duration: 0.4 },
                    filter: { duration: 0.3 }
                  }}
                  className="rounded-full"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: glowColor,
                    boxShadow: `
                      0 0 ${size * 1}px rgba(233, 138, 21, 0.5),
                      0 0 ${size * 2}px rgba(233, 138, 21, 0.3),
                      0 0 ${size * 3}px rgba(233, 138, 21, 0.2),
                      0 0 ${size * 4}px rgba(233, 138, 21, 0.1)
                    `,
                  }}
                />
              );
            })}
          </>
        )}
        
        {phase === 'morphing' && (
          <motion.div
            key="morphed-dot"
            initial={{ 
              scale: 1.5, 
              opacity: 0.3, 
              x: 20,
              filter: 'blur(3px)'
            }}
            animate={{ 
              scale: 1, 
              opacity: 0.8, 
              x: 0,
              filter: 'blur(0px)'
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              filter: 'blur(4px)'
            }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1], // Smooth, liquid ease out
              filter: { duration: 0.4 }
            }}
            className="rounded-full"
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: glowColor,
              boxShadow: `
                0 0 10px rgba(233, 138, 21, 0.5),
                0 0 20px rgba(233, 138, 21, 0.3),
                0 0 30px rgba(233, 138, 21, 0.2),
                0 0 40px rgba(233, 138, 21, 0.1)
              `,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

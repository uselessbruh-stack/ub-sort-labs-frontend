/**
 * BarChart — renders an array as animated vertical bars using Framer Motion.
 * Supports both number[] and {id, value}[] formats.
 * Uses layout animations so bars visually swap positions.
 *
 * Props:
 *   array        – number[] or {id, value}[]
 *   highlights   – { comparing: number[], swapping: number[], sorted: number[], pivot: number|null }
 *   maxValue     – scale ceiling (default 1000)
 *   showValues   – show value labels
 *   speedMs      – animation duration in ms
 */
import { useRef, useEffect, useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';

const BAR_COLORS = {
  default: '#333333',
  comparing: '#999999',
  swapping: '#000000',
  sorted: '#aaaaaa',
  pivot: '#555555',
};

export default function BarChart({
  array = [],
  highlights = {},
  maxValue = 1000,
  showValues,
  speedMs = 300,
}) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(400);
  const show = showValues ?? array.length <= 30;
  const { comparing = [], swapping = [], sorted = [], pivot = null } = highlights;
  const durationSec = Math.max(0.08, Math.min(speedMs / 1000, 0.5));

  // Normalize array: support both number[] and {id, value}[]
  const items = array.map((item, i) => {
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return item;
    }
    return { id: i, value: item };
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setContainerHeight(e.contentRect.height - 20);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function getBarState(index) {
    if (swapping.includes(index)) return 'swapping';
    if (comparing.includes(index)) return 'comparing';
    if (pivot === index) return 'pivot';
    if (sorted.includes(index)) return 'sorted';
    return 'default';
  }

  return (
    <div className="bar-chart-container" ref={containerRef}>
      <LayoutGroup>
        {items.map((item, i) => {
          const heightPx = Math.max((item.value / maxValue) * containerHeight, 4);
          const state = getBarState(i);
          const isSwapping = state === 'swapping';

          return (
            <motion.div
              key={item.id}
              className="bar-wrapper"
              style={{ flex: 1 }}
              layout
              transition={{
                layout: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  duration: durationSec,
                },
              }}
            >
              <motion.div
                animate={{
                  height: heightPx,
                  y: isSwapping ? [0, -10, 0] : 0,
                }}
                transition={{
                  height: { type: 'spring', stiffness: 250, damping: 22 },
                  y: { duration: durationSec * 0.6, ease: 'easeInOut' },
                }}
                style={{
                  width: '100%',
                  minWidth: '3px',
                  background: BAR_COLORS[state],
                  position: 'relative',
                  transformOrigin: 'bottom center',
                  border: isSwapping ? '1px dashed #000' : 'none',
                }}
              />
              {show && (
                <span className="bar-value">
                  {item.value}
                </span>
              )}
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}

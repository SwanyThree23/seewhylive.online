import React, { useState, useEffect, useRef } from 'react';

/**
 * Drop-in replacement for recharts' <ResponsiveContainer> that avoids the
 * React 18 "Should have a queue" race. The chart child is only mounted once
 * the wrapper has been measured with a non-zero size, and numeric
 * width/height are injected into the child — exactly what ResponsiveContainer
 * does, but without its internal useState/ResizeObserver firing during a
 * transition/commit, which is what triggers the crash.
 */
export default function SafeResponsiveContainer({ width = '100%', height = '100%', children, style, ...rest }) {
  const wrapRef = useRef(null);
  const lastRef = useRef({ w: -1, h: -1 });
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      if (w !== lastRef.current.w || h !== lastRef.current.h) {
        lastRef.current = { w, h };
        setSize({ w, h });
      }
    };
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ width, height, position: 'relative', ...style }} {...rest}>
      {size.w > 0 && size.h > 0 && React.isValidElement(children)
        ? React.cloneElement(children, { width: size.w, height: size.h })
        : null}
    </div>
  );
}
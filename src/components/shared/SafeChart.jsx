import React, { useState, useEffect, useRef } from 'react';

/**
 * Drop-in replacement for recharts' <ResponsiveContainer> that avoids the
 * React 18 "Should have a queue" race. The chart child is only mounted once
 * the wrapper has been measured with a non-zero size, and numeric
 * width/height are injected into the child — exactly what ResponsiveContainer
 * does, but without its internal useState/ResizeObserver firing during a
 * transition/commit, which is what triggers the crash.
 */
export default function SafeResponsiveContainer(props) {
  var width = props.width || '100%';
  var height = props.height || '100%';
  var children = props.children;
  var style = props.style;

  var wrapRef = useRef(null);
  var lastRef = useRef({ w: -1, h: -1 });

  var sizeState = useState({ w: 0, h: 0 });
  var size = sizeState[0];
  var setSize = sizeState[1];

  useEffect(function() {
    var el = wrapRef.current;
    if (!el) return;

    function measure() {
      var r = el.getBoundingClientRect();
      var w = Math.round(r.width);
      var h = Math.round(r.height);
      if (w !== lastRef.current.w || h !== lastRef.current.h) {
        lastRef.current = { w: w, h: h };
        setSize({ w: w, h: h });
      }
    }

    measure();
    var ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener('resize', measure);
    return function() {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div ref={wrapRef} style={Object.assign({ width: width, height: height, position: 'relative' }, style)}>
      {size.w > 0 && size.h > 0 && React.isValidElement(children)
        ? React.cloneElement(children, { width: size.w, height: size.h })
        : null}
    </div>
  );
}

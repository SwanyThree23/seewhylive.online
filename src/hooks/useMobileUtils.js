import { useState, useEffect, useRef, useCallback } from 'react';

export function useSafeArea() {
  return {
    top:    'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left:   'env(safe-area-inset-left, 0px)',
    right:  'env(safe-area-inset-right, 0px)',
  };
}

export function tapTarget(extraStyle) {
  var base = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (!extraStyle) return base;
  return Object.assign({}, base, extraStyle);
}

var _focusInjected = false;
export function injectFocusRing() {
  if (_focusInjected || typeof document === 'undefined') return;
  _focusInjected = true;
  var style = document.createElement('style');
  style.textContent = [
    ':focus-visible { outline: 2px solid #D4AF37 !important; outline-offset: 2px !important; }',
    ':focus:not(:focus-visible) { outline: none !important; }',
    '* { -webkit-tap-highlight-color: transparent; }',
    'body { color-scheme: dark; overscroll-behavior-y: contain; }',
    'button, [role="button"] { cursor: pointer; }',
  ].join('\n');
  document.head.appendChild(style);
}

export function usePullToRefresh(containerRef, onRefresh, threshold) {
  threshold = threshold || 72;
  var isPullingArr = useState(false);
  var isPulling = isPullingArr[0]; var setIsPulling = isPullingArr[1];
  var pullDistArr = useState(0);
  var pullDistance = pullDistArr[0]; var setPullDistance = pullDistArr[1];
  var isRefreshingArr = useState(false);
  var isRefreshing = isRefreshingArr[0]; var setIsRefreshing = isRefreshingArr[1];
  var startY = useRef(0);
  var pulling = useRef(false);

  useEffect(function() {
    var el = containerRef.current;
    if (!el) return;
    function onTouchStart(e) {
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
    function onTouchMove(e) {
      if (!pulling.current) return;
      var dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPullDistance(0); setIsPulling(false); return; }
      var dist = Math.min(threshold * 1.5, Math.sqrt(dy) * 8);
      setPullDistance(dist);
      setIsPulling(true);
      if (dy > 8) e.preventDefault();
    }
    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(Math.floor(threshold * 0.6));
        Promise.resolve(onRefresh()).then(function() {
          setIsRefreshing(false); setIsPulling(false); setPullDistance(0);
        }).catch(function() {
          setIsRefreshing(false); setIsPulling(false); setPullDistance(0);
        });
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return function() {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [containerRef, onRefresh, threshold, pullDistance, isRefreshing]);

  return { isPulling: isPulling, pullDistance: pullDistance, isRefreshing: isRefreshing };
}

import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Tracks a navigation history stack for hardware back button support
 * in iOS/Android WebViews. Child pages (Analytics, Notifications, etc.)
 * are pushed onto the stack, and the back button pops from it.
 *
 * Works alongside React Router's own history management — this hook
 * provides `canGoBack` / `goBack` for the header HUD and ensures
 * popstate events are handled correctly.
 */
export function useMobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const stackRef = useRef([location.pathname]);

  // Track navigation: push new paths on forward nav, pop on back nav
  useEffect(() => {
    const stack = stackRef.current;
    const currentPath = location.pathname;
    const lastEntry = stack[stack.length - 1];

    if (currentPath === lastEntry) return;

    // If navigating back (current path matches the previous stack entry)
    if (stack.length >= 2 && currentPath === stack[stack.length - 2]) {
      stack.pop();
    } else {
      // Forward navigation — push onto stack
      stack.push(currentPath);
    }
  }, [location.pathname]);

  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) {
      navigate(-1);
      return true;
    }
    return false;
  }, [navigate]);

  return {
    canGoBack: stackRef.current.length > 1,
    goBack,
    stackDepth: stackRef.current.length,
  };
}
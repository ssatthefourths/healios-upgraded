import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Handles scroll behaviour on route changes.
 * - If the URL contains a hash (#anchor), scrolls to the target element
 *   after a short delay to allow the page to render.
 * - If there is no hash, scrolls to the top of the page.
 *
 * Uses the same getBoundingClientRect + window.scrollTo pattern as FAQ.tsx
 * so it works correctly with the Lenis smooth-scroll provider.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1); // strip leading #
      // Delay allows the page to finish rendering after navigation
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          // 80px offset for the sticky header
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;

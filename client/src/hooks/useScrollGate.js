import { useEffect, useState } from "react";

/**
 * Returns true once the user has scrolled past the target.
 * If targetSelector not found, falls back to Y > fallbackPx.
 */
export default function useScrollGate(targetSelector = "#hero", ratio = 0.6, fallbackPx = 96) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.querySelector(targetSelector);
    if (!el) {
      const onScroll = () => setScrolled(window.scrollY > fallbackPx);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        // when less than (1 - ratio) of hero is visible => scrolled
        setScrolled(entry.intersectionRatio < (1 - ratio));
      },
      { root: null, threshold: [0, .2, .4, .6, .8, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [targetSelector, ratio, fallbackPx]);

  return scrolled;
}

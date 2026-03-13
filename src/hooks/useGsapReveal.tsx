import { useEffect, useRef } from "react";
import gsap from "gsap";

type RevealOptions = {
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  delay?: number;
  threshold?: number;
  stagger?: number;
  ease?: string;
  triggerDeps?: any[];
};

export const useGsapReveal = (options: RevealOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const {
    direction = "up",
    distance = 50,
    duration = 0.8,
    delay = 0,
    threshold = 0.1,
    stagger = 0,
    ease = "power3.out",
    triggerDeps = [],
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(element, { opacity: 1, visibility: "visible" });
      if (stagger > 0) {
        gsap.set(element.children, { opacity: 1, visibility: "visible" });
      }
      return;
    }

    let x = 0;
    let y = 0;

    switch (direction) {
      case "up": y = distance; break;
      case "down": y = -distance; break;
      case "left": x = distance; break;
      case "right": x = -distance; break;
      case "none": break;
    }

    let ctx = gsap.context(() => {
      // Setup initial state
      if (stagger > 0 && element.children.length > 0) {
        gsap.set(element.children, { opacity: 0, x, y });
      } else {
        gsap.set(element, { opacity: 0, x, y });
      }

      // Intersection Observer for triggering animation
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (stagger > 0 && element.children.length > 0) {
                gsap.to(element.children, {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  duration,
                  delay,
                  stagger,
                  ease,
                  clearProps: "all"
                });
              } else {
                gsap.to(element, {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  duration,
                  delay,
                  ease,
                  clearProps: "all"
                });
              }
              observer.unobserve(element);
            }
          });
        },
        { threshold }
      );

      observer.observe(element);
    }, element);

    return () => ctx.revert();
  }, [direction, distance, duration, delay, threshold, stagger, ease, ...triggerDeps]);

  return ref;
};

import { useState, useEffect } from "react";

export const BREAKPOINTS = {
  xs: 480,
  s: 768,
  m: 992,
  l: 1200,
} as const;

export function useIsMobile(breakpoint: number = BREAKPOINTS.xs): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe: check if window exists
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export function useIsTablet(): boolean {
  return useIsMobile(BREAKPOINTS.s);
}

export function useIsDesktop(): boolean {
  return !useIsMobile(BREAKPOINTS.m);
}

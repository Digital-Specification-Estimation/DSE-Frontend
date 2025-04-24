"use client";

import { useEffect } from "react";
import { usePageVisibility } from "./use-page-visibility";

type RefetchFunction = () => void;

interface UseAutoRefetchOptions {
  interval?: number; // in milliseconds
  refetchOnVisibilityChange?: boolean;
  refetchOnMount?: boolean;
  refetchOnFocus?: boolean;
}

export function useAutoRefetch(
  refetchFn: RefetchFunction,
  options: UseAutoRefetchOptions = {}
) {
  const {
    interval = 60000, // Default to 1 minute
    refetchOnVisibilityChange = true,
    refetchOnMount = true,
    refetchOnFocus = true,
  } = options;

  const isVisible = usePageVisibility();

  useEffect(() => {
    // Refetch on mount if enabled
    if (refetchOnMount) {
      refetchFn();
    }

    // Set up interval for periodic refetching
    const intervalId = setInterval(() => {
      // Only refetch if the page is visible to save resources
      if (isVisible) {
        refetchFn();
      }
    }, interval);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetchFn, interval, refetchOnMount, isVisible]);

  // Handle visibility change (tab becomes active)
  useEffect(() => {
    if (refetchOnVisibilityChange && isVisible) {
      refetchFn();
    }
  }, [refetchOnVisibilityChange, isVisible, refetchFn]);

  // Handle window focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      refetchFn();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetchOnFocus, refetchFn]);
}

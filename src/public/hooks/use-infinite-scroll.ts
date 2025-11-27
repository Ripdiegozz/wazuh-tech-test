import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Callback when user scrolls near the bottom */
  onLoadMore: () => void;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Distance from bottom to trigger load (in pixels) */
  threshold?: number;
  /** The scrollable container ref (defaults to window) */
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook for infinite scroll functionality
 * Triggers onLoadMore when user scrolls near the bottom
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  scrollContainerRef,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: scrollContainerRef?.current || null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    });

    // Observe the sentinel element
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, scrollContainerRef]);

  return {
    /** Ref to attach to the sentinel element at the bottom */
    loadMoreRef,
    /** Whether currently loading more items */
    isLoadingMore: isLoading,
  };
}


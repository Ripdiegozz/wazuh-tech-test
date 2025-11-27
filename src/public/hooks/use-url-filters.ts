import { useCallback } from 'react';
import { TodoStatus } from '../../common/types';

interface UrlFilters {
  view?: string;
  query?: string;
  status?: TodoStatus[];
  priority?: string;
}

/**
 * Reads filter state from URL search params
 */
export function getFiltersFromUrl(): UrlFilters {
  const params = new URLSearchParams(window.location.search);
  
  const view = params.get('view') || undefined;
  const query = params.get('q') || undefined;
  const priority = params.get('priority') || undefined;
  
  // Parse status array
  const statusParam = params.get('status');
  const status = statusParam 
    ? statusParam.split(',').filter(s => Object.values(TodoStatus).includes(s as TodoStatus)) as TodoStatus[]
    : undefined;
  
  return { view, query, status, priority };
}

/**
 * Updates URL with current filters (without page reload)
 */
export function updateUrlFilters(filters: UrlFilters): void {
  const params = new URLSearchParams();
  
  if (filters.view && filters.view !== 'board') {
    params.set('view', filters.view);
  }
  if (filters.query) {
    params.set('q', filters.query);
  }
  if (filters.status && filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }
  if (filters.priority && filters.priority !== 'all') {
    params.set('priority', filters.priority);
  }
  
  const newUrl = params.toString() 
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  
  window.history.replaceState(null, '', newUrl);
}

/**
 * Hook to sync filters with URL
 * Returns initial values from URL on first render
 */
export function useUrlFilters() {
  const syncToUrl = useCallback((filters: UrlFilters) => {
    updateUrlFilters(filters);
  }, []);

  return {
    initialFilters: getFiltersFromUrl(),
    syncToUrl,
  };
}


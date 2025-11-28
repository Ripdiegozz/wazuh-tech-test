import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedSearch(value: string, delay: number = 300): string {
  const [debouncedValue, setDebouncedValue] = useState<string>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousValueRef = useRef<string>(value);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If value is empty (user cleared the field)
    if (value === '' || value.trim() === '') {
      // Update immediately without debounce
      setDebouncedValue('');
      previousValueRef.current = '';
      return;
    }

    // If we're typing, debounce the update
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      previousValueRef.current = value;
    }, delay);

    // Cleanup on unmount or value change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}


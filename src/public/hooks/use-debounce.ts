import { useState, useEffect, useRef } from 'react';

/**
 * Hook that debounces a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
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

/**
 * Hook that debounces a string value for search
 * - Debounces input while typing
 * - Immediately clears when value becomes empty (no delay for clear)
 * - Uses a ref to track previous value to ensure state updates
 * 
 * @param value - The string value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
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


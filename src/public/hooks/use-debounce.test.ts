/**
 * Tests for Debounce Hooks
 * Run with: yarn test
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce, useDebouncedSearch } from './use-debounce';

// Use fake timers for debounce testing
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Change value
    rerender({ value: 'updated' });

    // Value should not have changed yet
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    // Rapid changes
    rerender({ value: 'ab' });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'abc' });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'abcd' });

    // Still should be original value
    expect(result.current).toBe('a');

    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should be final value
    expect(result.current).toBe('abcd');
  });

  it('should work with different types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 42 } }
    );

    rerender({ value: 100 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(100);
  });
});

describe('useDebouncedSearch', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedSearch('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce search input', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSearch(value, 300),
      { initialProps: { value: '' } }
    );

    rerender({ value: 'search' });

    // Should still be empty
    expect(result.current).toBe('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('search');
  });

  it('should clear immediately when value is emptied', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSearch(value, 300),
      { initialProps: { value: 'search' } }
    );

    // Wait for initial value to be set
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('search');

    // Clear the value
    rerender({ value: '' });

    // Should clear immediately (no debounce for clearing)
    expect(result.current).toBe('');
  });

  it('should clear immediately for whitespace-only input', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSearch(value, 300),
      { initialProps: { value: 'test' } }
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: '   ' });

    // Should clear immediately
    expect(result.current).toBe('');
  });

  it('should debounce during rapid typing', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSearch(value, 300),
      { initialProps: { value: '' } }
    );

    // Simulate typing
    rerender({ value: 's' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'se' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'sea' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'sear' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'searc' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'search' });

    // Still debouncing
    expect(result.current).toBe('');

    // Wait for debounce to complete
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('search');
  });
});


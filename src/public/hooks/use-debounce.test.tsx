/**
 * Tests for Debounce Hooks
 * Using @testing-library/react instead of react-hooks to avoid
 * React version conflicts in the Docker container.
 */
import * as React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useDebounce, useDebouncedSearch } from './use-debounce';

// Use fake timers for debounce testing
jest.useFakeTimers();

// Test component that displays the debounced value
const DebounceTestComponent: React.FC<{ value: string; delay?: number }> = ({
  value,
  delay = 300,
}) => {
  const debouncedValue = useDebounce(value, delay);
  return <div data-testid="debounced-value">{debouncedValue}</div>;
};

const DebounceNumberTestComponent: React.FC<{ value: number; delay?: number }> = ({
  value,
  delay = 300,
}) => {
  const debouncedValue = useDebounce(value, delay);
  return <div data-testid="debounced-value">{debouncedValue}</div>;
};

const DebouncedSearchTestComponent: React.FC<{ value: string; delay?: number }> = ({
  value,
  delay = 300,
}) => {
  const debouncedValue = useDebouncedSearch(value, delay);
  return <div data-testid="debounced-value">{debouncedValue}</div>;
};

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return initial value immediately', () => {
    render(<DebounceTestComponent value="initial" />);
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('initial');
  });

  it('should debounce value changes', () => {
    const { rerender } = render(<DebounceTestComponent value="initial" />);

    // Change value
    rerender(<DebounceTestComponent value="updated" />);

    // Value should not have changed yet
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('initial');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Now value should be updated
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { rerender } = render(<DebounceTestComponent value="a" />);

    // Rapid changes
    rerender(<DebounceTestComponent value="ab" />);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender(<DebounceTestComponent value="abc" />);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender(<DebounceTestComponent value="abcd" />);

    // Still should be original value
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('a');

    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should be final value
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('abcd');
  });

  it('should work with different types', () => {
    const { rerender } = render(<DebounceNumberTestComponent value={42} />);

    rerender(<DebounceNumberTestComponent value={100} />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('debounced-value')).toHaveTextContent('100');
  });
});

describe('useDebouncedSearch', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return initial value immediately', () => {
    render(<DebouncedSearchTestComponent value="test" />);
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('test');
  });

  it('should debounce search input', () => {
    const { rerender } = render(<DebouncedSearchTestComponent value="" />);

    rerender(<DebouncedSearchTestComponent value="search" />);

    // Should still be empty
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('debounced-value')).toHaveTextContent('search');
  });

  it('should clear immediately when value is emptied', () => {
    const { rerender } = render(<DebouncedSearchTestComponent value="search" />);

    // Wait for initial value to be set
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('debounced-value')).toHaveTextContent('search');

    // Clear the value
    rerender(<DebouncedSearchTestComponent value="" />);

    // Should clear immediately (no debounce for clearing)
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('');
  });

  it('should clear immediately for whitespace-only input', () => {
    const { rerender } = render(<DebouncedSearchTestComponent value="test" />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender(<DebouncedSearchTestComponent value="   " />);

    // Should clear immediately
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('');
  });

  it('should debounce during rapid typing', () => {
    const { rerender } = render(<DebouncedSearchTestComponent value="" />);

    // Simulate typing
    rerender(<DebouncedSearchTestComponent value="s" />);
    act(() => jest.advanceTimersByTime(50));

    rerender(<DebouncedSearchTestComponent value="se" />);
    act(() => jest.advanceTimersByTime(50));

    rerender(<DebouncedSearchTestComponent value="sea" />);
    act(() => jest.advanceTimersByTime(50));

    rerender(<DebouncedSearchTestComponent value="sear" />);
    act(() => jest.advanceTimersByTime(50));

    rerender(<DebouncedSearchTestComponent value="searc" />);
    act(() => jest.advanceTimersByTime(50));

    rerender(<DebouncedSearchTestComponent value="search" />);

    // Still debouncing
    expect(screen.getByTestId('debounced-value')).toHaveTextContent('');

    // Wait for debounce to complete
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('debounced-value')).toHaveTextContent('search');
  });
});


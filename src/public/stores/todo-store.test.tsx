/**
 * Tests for Todo Store (Context + Reducer)
 * Using @testing-library/react instead of react-hooks to avoid
 * React version conflicts in the Docker container.
 */
import * as React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TodoProvider, useTodoStore } from './todo-store';
import { TodoStatus, TodoPriority, TodoItem } from '../../common/types';

const mockTodo: TodoItem = {
  id: 'test-1',
  title: 'Test Todo',
  status: TodoStatus.PLANNED,
  priority: TodoPriority.MEDIUM,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  archived: false,
  tags: [],
  complianceStandards: [],
};

// Test component that exposes store state
const StoreTestComponent: React.FC<{
  onStore?: (store: ReturnType<typeof useTodoStore>) => void;
}> = ({ onStore }) => {
  const store = useTodoStore();
  
  // Call callback with store reference
  React.useEffect(() => {
    if (onStore) {
      onStore(store);
    }
  }, [store, onStore]);

  return (
    <div>
      <div data-testid="todos-count">{store.todos.length}</div>
      <div data-testid="current-view">{store.currentView}</div>
      <div data-testid="loading">{String(store.loading)}</div>
      <div data-testid="is-modal-open">{String(store.isModalOpen)}</div>
      <div data-testid="filters-query">{store.filters.query}</div>
      <div data-testid="detail-panel-todo">{store.detailPanelTodo?.id || 'none'}</div>
      {store.todos.length > 0 && (
        <div data-testid="first-todo-title">{store.todos[0].title}</div>
      )}
    </div>
  );
};

describe('TodoStore', () => {
  let storeRef: ReturnType<typeof useTodoStore> | null = null;

  const renderWithProvider = () => {
    const captureStore = (store: ReturnType<typeof useTodoStore>) => {
      storeRef = store;
    };

    return render(
      <TodoProvider>
        <StoreTestComponent onStore={captureStore} />
      </TodoProvider>
    );
  };

  beforeEach(() => {
    storeRef = null;
  });

  it('should have correct initial state', () => {
    renderWithProvider();

    expect(screen.getByTestId('todos-count')).toHaveTextContent('0');
    expect(screen.getByTestId('current-view')).toHaveTextContent('board');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('should set and add todos', () => {
    renderWithProvider();

    act(() => {
      storeRef?.setTodos([mockTodo]);
    });
    expect(screen.getByTestId('todos-count')).toHaveTextContent('1');

    act(() => {
      storeRef?.addTodo({ ...mockTodo, id: 'test-2' });
    });
    expect(screen.getByTestId('todos-count')).toHaveTextContent('2');
  });

  it('should update a todo', () => {
    renderWithProvider();

    act(() => {
      storeRef?.setTodos([mockTodo]);
    });

    act(() => {
      storeRef?.updateTodoInStore('test-1', { title: 'Updated' });
    });

    expect(screen.getByTestId('first-todo-title')).toHaveTextContent('Updated');
  });

  it('should change view and manage filters', () => {
    renderWithProvider();

    act(() => {
      storeRef?.setView('table');
    });
    expect(screen.getByTestId('current-view')).toHaveTextContent('table');

    act(() => {
      storeRef?.setFilters({ query: 'search' });
    });
    expect(screen.getByTestId('filters-query')).toHaveTextContent('search');

    act(() => {
      storeRef?.resetFilters();
    });
    expect(screen.getByTestId('filters-query')).toHaveTextContent('');
  });

  it('should toggle modal and detail panel', () => {
    renderWithProvider();

    act(() => {
      storeRef?.openCreateModal();
    });
    expect(screen.getByTestId('is-modal-open')).toHaveTextContent('true');

    act(() => {
      storeRef?.closeModal();
    });
    expect(screen.getByTestId('is-modal-open')).toHaveTextContent('false');

    act(() => {
      storeRef?.openDetailPanel(mockTodo);
    });
    expect(screen.getByTestId('detail-panel-todo')).toHaveTextContent('test-1');
  });
});

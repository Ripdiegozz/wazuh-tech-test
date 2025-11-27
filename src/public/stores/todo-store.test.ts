/**
 * Tests for TodoStore (React Context based)
 * Run with: yarn test
 */
import * as React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { TodoProvider, useTodoStore } from './todo-store';
import { TodoItem, TodoStatus, TodoPriority } from '../../common/types';

// Mock data
const mockTodo: TodoItem = {
  id: '1',
  title: 'Test Todo',
  description: 'Test description',
  status: TodoStatus.PLANNED,
  priority: TodoPriority.MEDIUM,
  tags: ['test'],
  complianceStandards: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
};

const mockTodo2: TodoItem = {
  id: '2',
  title: 'Test Todo 2',
  description: 'Another test',
  status: TodoStatus.IN_PROGRESS,
  priority: TodoPriority.HIGH,
  tags: ['urgent'],
  complianceStandards: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
};

// Wrapper component
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(TodoProvider, null, children);

describe('TodoStore', () => {
  describe('Todos Management', () => {
    it('should set todos', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setTodos([mockTodo, mockTodo2]);
      });

      expect(result.current.todos).toHaveLength(2);
      expect(result.current.todos[0].id).toBe('1');
    });

    it('should add a todo', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.addTodo(mockTodo);
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('Test Todo');
    });

    it('should update a todo in store', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setTodos([mockTodo]);
      });

      act(() => {
        result.current.updateTodoInStore('1', { title: 'Updated Title' });
      });

      expect(result.current.todos[0].title).toBe('Updated Title');
    });

    it('should remove a todo', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setTodos([mockTodo, mockTodo2]);
      });

      act(() => {
        result.current.removeTodo('1');
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].id).toBe('2');
    });
  });

  describe('Archived Todos', () => {
    it('should set archived todos', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });
      const archivedTodo = { ...mockTodo, archived: true };

      act(() => {
        result.current.setArchivedTodos([archivedTodo]);
      });

      expect(result.current.archivedTodos).toHaveLength(1);
      expect(result.current.archivedTodos[0].archived).toBe(true);
    });
  });

  describe('View Management', () => {
    it('should change current view', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      expect(result.current.currentView).toBe('board');

      act(() => {
        result.current.setView('table');
      });

      expect(result.current.currentView).toBe('table');

      act(() => {
        result.current.setView('archived');
      });

      expect(result.current.currentView).toBe('archived');
    });
  });

  describe('Loading & Error State', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('should manage error state', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Filter Management', () => {
    it('should update filters', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setFilters({ query: 'test query' });
      });

      expect(result.current.filters.query).toBe('test query');

      act(() => {
        result.current.setFilters({ assignee: 'john' });
      });

      expect(result.current.filters.query).toBe('test query');
      expect(result.current.filters.assignee).toBe('john');
    });

    it('should toggle status filter', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      expect(result.current.filters.status).toHaveLength(0);

      act(() => {
        result.current.toggleStatusFilter(TodoStatus.PLANNED);
      });

      expect(result.current.filters.status).toContain(TodoStatus.PLANNED);

      act(() => {
        result.current.toggleStatusFilter(TodoStatus.IN_PROGRESS);
      });

      expect(result.current.filters.status).toHaveLength(2);

      act(() => {
        result.current.toggleStatusFilter(TodoStatus.PLANNED);
      });

      expect(result.current.filters.status).not.toContain(TodoStatus.PLANNED);
      expect(result.current.filters.status).toHaveLength(1);
    });

    it('should reset filters', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setFilters({
          query: 'test',
          assignee: 'john',
          status: [TodoStatus.PLANNED],
        });
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.query).toBe('');
      expect(result.current.filters.assignee).toBe('');
      expect(result.current.filters.status).toHaveLength(0);
    });
  });

  describe('Modal State', () => {
    it('should open create modal', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      expect(result.current.isModalOpen).toBe(false);

      act(() => {
        result.current.openCreateModal();
      });

      expect(result.current.isModalOpen).toBe(true);
    });

    it('should close modal', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.openCreateModal();
      });

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isModalOpen).toBe(false);
    });
  });

  describe('Detail Panel State', () => {
    it('should open detail panel with todo', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      expect(result.current.detailPanelTodo).toBeNull();

      act(() => {
        result.current.openDetailPanel(mockTodo);
      });

      expect(result.current.detailPanelTodo).toEqual(mockTodo);
    });

    it('should close detail panel', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.openDetailPanel(mockTodo);
      });

      act(() => {
        result.current.closeDetailPanel();
      });

      expect(result.current.detailPanelTodo).toBeNull();
    });

    it('should update detail panel todo when updating todo in store', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setTodos([mockTodo]);
        result.current.openDetailPanel(mockTodo);
      });

      act(() => {
        result.current.updateTodoInStore('1', { title: 'Updated Title' });
      });

      expect(result.current.detailPanelTodo?.title).toBe('Updated Title');
    });
  });

  describe('Computed Values', () => {
    it('should group todos by status', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setTodos([mockTodo, mockTodo2]);
      });

      const grouped = result.current.getTodosByStatus();

      expect(grouped[TodoStatus.PLANNED]).toHaveLength(1);
      expect(grouped[TodoStatus.IN_PROGRESS]).toHaveLength(1);
      expect(grouped[TodoStatus.COMPLETED_SUCCESS]).toHaveLength(0);
    });

    it('should generate search params from filters', () => {
      const { result } = renderHook(() => useTodoStore(), { wrapper });

      act(() => {
        result.current.setFilters({
          query: 'security',
          status: [TodoStatus.PLANNED, TodoStatus.IN_PROGRESS],
        });
      });

      const params = result.current.getSearchParams();

      expect(params.query).toBe('security');
      expect(params.status).toEqual([TodoStatus.PLANNED, TodoStatus.IN_PROGRESS]);
      expect(params.archived).toBe(false);
      expect(params.size).toBe(100);
    });
  });
});


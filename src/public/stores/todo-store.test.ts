/**
 * Tests for Todo Store (Context + Reducer)
 */
import * as React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { TodoProvider, useTodoStore } from './todo-store';
import { TodoStatus, TodoPriority } from '../../common/types';

const mockTodo = {
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

describe('TodoStore', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(TodoProvider, null, children);

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useTodoStore(), { wrapper });

    expect(result.current.todos).toEqual([]);
    expect(result.current.currentView).toBe('board');
    expect(result.current.loading).toBe(false);
  });

  it('should set and add todos', () => {
    const { result } = renderHook(() => useTodoStore(), { wrapper });

    act(() => {
      result.current.setTodos([mockTodo]);
    });
    expect(result.current.todos).toHaveLength(1);

    act(() => {
      result.current.addTodo({ ...mockTodo, id: 'test-2' });
    });
    expect(result.current.todos).toHaveLength(2);
  });

  it('should update a todo', () => {
    const { result } = renderHook(() => useTodoStore(), { wrapper });

    act(() => {
      result.current.setTodos([mockTodo]);
      result.current.updateTodoInStore('test-1', { title: 'Updated' });
    });

    expect(result.current.todos[0].title).toBe('Updated');
  });

  it('should change view and manage filters', () => {
    const { result } = renderHook(() => useTodoStore(), { wrapper });

    act(() => {
      result.current.setView('table');
    });
    expect(result.current.currentView).toBe('table');

    act(() => {
      result.current.setFilters({ query: 'search' });
    });
    expect(result.current.filters.query).toBe('search');

    act(() => {
      result.current.resetFilters();
    });
    expect(result.current.filters.query).toBe('');
  });

  it('should toggle modal and detail panel', () => {
    const { result } = renderHook(() => useTodoStore(), { wrapper });

    act(() => result.current.openCreateModal());
    expect(result.current.isModalOpen).toBe(true);

    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);

    act(() => result.current.openDetailPanel(mockTodo));
    expect(result.current.detailPanelTodo?.id).toBe('test-1');
  });
});

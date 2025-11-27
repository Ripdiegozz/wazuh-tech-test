import * as React from 'react';
import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { TodoItem, TodoStatus, TodoPriority, TodoSearchParams } from '../../common/types';

// ============================================
// Types
// ============================================
export type ViewType = 'board' | 'table' | 'archived' | 'stats';

export interface TodoFilters {
  query: string;
  status: TodoStatus[];
  priority: TodoPriority[];
  assignee: string;
}

interface TodoState {
  todos: TodoItem[];
  archivedTodos: TodoItem[];
  currentView: ViewType;
  loading: boolean;
  error: string | null;
  filters: TodoFilters;
  // Create Modal
  isModalOpen: boolean;
  // Detail Panel (Preview with inline edit)
  detailPanelTodo: TodoItem | null;
}

// ============================================
// Actions
// ============================================
type TodoAction =
  | { type: 'SET_TODOS'; payload: TodoItem[] }
  | { type: 'SET_ARCHIVED_TODOS'; payload: TodoItem[] }
  | { type: 'ADD_TODO'; payload: TodoItem }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<TodoItem> } }
  | { type: 'REMOVE_TODO'; payload: string }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<TodoFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'TOGGLE_STATUS_FILTER'; payload: TodoStatus }
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'OPEN_DETAIL_PANEL'; payload: TodoItem }
  | { type: 'CLOSE_DETAIL_PANEL' };

// ============================================
// Initial State
// ============================================
const initialFilters: TodoFilters = {
  query: '',
  status: [],
  priority: [],
  assignee: '',
};

const initialState: TodoState = {
  todos: [],
  archivedTodos: [],
  currentView: 'board',
  loading: false,
  error: null,
  filters: initialFilters,
  isModalOpen: false,
  detailPanelTodo: null,
};

// ============================================
// Reducer
// ============================================
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'SET_TODOS':
      return { ...state, todos: action.payload };

    case 'SET_ARCHIVED_TODOS':
      return { ...state, archivedTodos: action.payload };

    case 'ADD_TODO':
      return { ...state, todos: [action.payload, ...state.todos] };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
        archivedTodos: state.archivedTodos.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
        // Also update detail panel if viewing the same todo
        detailPanelTodo: state.detailPanelTodo?.id === action.payload.id
          ? { ...state.detailPanelTodo, ...action.payload.updates }
          : state.detailPanelTodo,
      };

    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.payload),
        archivedTodos: state.archivedTodos.filter((t) => t.id !== action.payload),
      };

    case 'SET_VIEW':
      return { ...state, currentView: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case 'RESET_FILTERS':
      return { ...state, filters: initialFilters };

    case 'TOGGLE_STATUS_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          status: state.filters.status.includes(action.payload)
            ? state.filters.status.filter((s) => s !== action.payload)
            : [...state.filters.status, action.payload],
        },
      };

    case 'OPEN_CREATE_MODAL':
      return { ...state, isModalOpen: true };

    case 'CLOSE_MODAL':
      return { ...state, isModalOpen: false };

    case 'OPEN_DETAIL_PANEL':
      return { ...state, detailPanelTodo: action.payload };

    case 'CLOSE_DETAIL_PANEL':
      return { ...state, detailPanelTodo: null };

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================
interface TodoContextValue extends TodoState {
  // Actions
  setTodos: (todos: TodoItem[]) => void;
  setArchivedTodos: (todos: TodoItem[]) => void;
  addTodo: (todo: TodoItem) => void;
  updateTodoInStore: (id: string, updates: Partial<TodoItem>) => void;
  removeTodo: (id: string) => void;
  setView: (view: ViewType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<TodoFilters>) => void;
  resetFilters: () => void;
  toggleStatusFilter: (status: TodoStatus) => void;
  openCreateModal: () => void;
  closeModal: () => void;
  // Detail Panel
  openDetailPanel: (todo: TodoItem) => void;
  closeDetailPanel: () => void;
  // Computed
  getTodosByStatus: () => Record<TodoStatus, TodoItem[]>;
  getSearchParams: () => TodoSearchParams;
}

const TodoContext = createContext<TodoContextValue | null>(null);

// ============================================
// Provider
// ============================================
export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Actions
  const setTodos = useCallback((todos: TodoItem[]) => {
    dispatch({ type: 'SET_TODOS', payload: todos });
  }, []);

  const setArchivedTodos = useCallback((todos: TodoItem[]) => {
    dispatch({ type: 'SET_ARCHIVED_TODOS', payload: todos });
  }, []);

  const addTodo = useCallback((todo: TodoItem) => {
    dispatch({ type: 'ADD_TODO', payload: todo });
  }, []);

  const updateTodoInStore = useCallback((id: string, updates: Partial<TodoItem>) => {
    dispatch({ type: 'UPDATE_TODO', payload: { id, updates } });
  }, []);

  const removeTodo = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TODO', payload: id });
  }, []);

  const setView = useCallback((view: ViewType) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setFilters = useCallback((filters: Partial<TodoFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const toggleStatusFilter = useCallback((status: TodoStatus) => {
    dispatch({ type: 'TOGGLE_STATUS_FILTER', payload: status });
  }, []);

  const openCreateModal = useCallback(() => {
    dispatch({ type: 'OPEN_CREATE_MODAL' });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Detail Panel
  const openDetailPanel = useCallback((todo: TodoItem) => {
    dispatch({ type: 'OPEN_DETAIL_PANEL', payload: todo });
  }, []);

  const closeDetailPanel = useCallback(() => {
    dispatch({ type: 'CLOSE_DETAIL_PANEL' });
  }, []);

  // Computed
  const getTodosByStatus = useCallback(() => {
    const grouped: Record<TodoStatus, TodoItem[]> = {
      [TodoStatus.PLANNED]: [],
      [TodoStatus.IN_PROGRESS]: [],
      [TodoStatus.BLOCKED]: [],
      [TodoStatus.COMPLETED_SUCCESS]: [],
      [TodoStatus.COMPLETED_ERROR]: [],
    };

    state.todos.forEach((todo) => {
      if (grouped[todo.status]) {
        grouped[todo.status].push(todo);
      }
    });

    return grouped;
  }, [state.todos]);

  const getSearchParams = useCallback((): TodoSearchParams => {
    return {
      query: state.filters.query || undefined,
      status: state.filters.status.length > 0 ? state.filters.status : undefined,
      priority: state.filters.priority.length > 0 ? state.filters.priority : undefined,
      assignee: state.filters.assignee || undefined,
      archived: false,
      size: 100,
    };
  }, [state.filters]);

  const value = useMemo<TodoContextValue>(() => ({
    ...state,
    setTodos,
    setArchivedTodos,
    addTodo,
    updateTodoInStore,
    removeTodo,
    setView,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    toggleStatusFilter,
    openCreateModal,
    closeModal,
    openDetailPanel,
    closeDetailPanel,
    getTodosByStatus,
    getSearchParams,
  }), [
    state,
    setTodos,
    setArchivedTodos,
    addTodo,
    updateTodoInStore,
    removeTodo,
    setView,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    toggleStatusFilter,
    openCreateModal,
    closeModal,
    openDetailPanel,
    closeDetailPanel,
    getTodosByStatus,
    getSearchParams,
  ]);

  return React.createElement(TodoContext.Provider, { value }, children);
};

// ============================================
// Hook
// ============================================
export const useTodoStore = (): TodoContextValue => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoStore must be used within a TodoProvider');
  }
  return context;
};

// Export types
export type { TodoState, TodoAction };


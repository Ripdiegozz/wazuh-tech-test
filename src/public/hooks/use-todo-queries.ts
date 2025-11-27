import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStart } from '../../../../../src/core/public';
import { TodosApiService } from '../services';
import { 
  TodoItem, 
  TodoSearchParams, 
  CreateTodoRequest, 
  UpdateTodoRequest,
  PaginatedResponse,
} from '../../common/types';

// ============================================
// Query Keys
// ============================================
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (params: TodoSearchParams) => [...todoKeys.lists(), params] as const,
  archived: () => [...todoKeys.all, 'archived'] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
  statistics: () => [...todoKeys.all, 'statistics'] as const,
};

// ============================================
// Store Actions Interface
// ============================================
export interface StoreActions {
  setTodos: (todos: TodoItem[]) => void;
  setArchivedTodos: (todos: TodoItem[]) => void;
  addTodo: (todo: TodoItem) => void;
  updateTodoInStore: (id: string, updates: Partial<TodoItem>) => void;
  removeTodo: (id: string) => void;
  setLoading: (loading: boolean) => void;
  closeModal: () => void;
  // Pending state actions
  addPendingId: (id: string) => void;
  removePendingId: (id: string) => void;
}

// ============================================
// Hook Factory
// ============================================
export const createTodoHooks = (http: HttpStart, storeActions: StoreActions) => {
  const api = new TodosApiService(http);
  const {
    setTodos,
    setArchivedTodos,
    addTodo,
    updateTodoInStore,
    removeTodo,
    setLoading,
    closeModal,
    addPendingId,
    removePendingId,
  } = storeActions;

  // ============================================
  // Queries
  // ============================================
  
  /**
   * Fetch todos with filters
   */
  const useTodos = (params: TodoSearchParams = {}) => {
    // Clean params - remove undefined/empty values for consistent cache keys
    const cleanParams = {
      ...params,
      query: params.query || undefined,
      archived: false,
    };

    return useQuery({
      queryKey: todoKeys.list(cleanParams),
      queryFn: async () => {
        setLoading(true);
        try {
          const response = await api.searchTodos(cleanParams);
          setTodos(response.items);
          return response;
        } finally {
          setLoading(false);
        }
      },
      staleTime: 0, // Always refetch when query changes
      refetchOnWindowFocus: true,
    });
  };

  /**
   * Fetch archived todos
   */
  const useArchivedTodos = () => {
    return useQuery({
      queryKey: todoKeys.archived(),
      queryFn: async () => {
        const response = await api.searchTodos({ archived: true, size: 100 });
        setArchivedTodos(response.items);
        return response;
      },
      staleTime: 30000,
    });
  };

  /**
   * Fetch single todo by ID
   */
  const useTodo = (id: string) => {
    return useQuery({
      queryKey: todoKeys.detail(id),
      queryFn: () => api.getTodoById(id),
      enabled: !!id,
    });
  };

  /**
   * Fetch statistics
   */
  const useStatistics = () => {
    return useQuery({
      queryKey: todoKeys.statistics(),
      queryFn: () => api.getStatistics(),
      staleTime: 60000, // 1 minute
    });
  };

  // ============================================
  // Mutations
  // ============================================
  
  /**
   * Create a new todo
   */
  const useCreateTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateTodoRequest) => api.createTodo(data),
      onSuccess: (newTodo) => {
        addTodo(newTodo);
        closeModal();
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
    });
  };

  /**
   * Update a todo
   */
  const useUpdateTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTodoRequest }) => 
        api.updateTodo(id, data),
      onMutate: async ({ id, data }) => {
        addPendingId(id); // Mark as pending
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
        updateTodoInStore(id, data as Partial<TodoItem>);
      },
      onSuccess: (_, { id }) => {
        removePendingId(id); // Clear pending state
        closeModal();
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, { id }) => {
        removePendingId(id); // Clear pending state on error
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      },
    });
  };

  /**
   * Delete a todo
   */
  const useDeleteTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => api.deleteTodo(id),
      onMutate: async (id) => {
        addPendingId(id);
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
        removeTodo(id);
      },
      onSuccess: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      },
    });
  };

  /**
   * Archive a todo
   */
  const useArchiveTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => api.archiveTodo(id),
      onMutate: async (id) => {
        addPendingId(id);
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
      },
      onSuccess: (_, id) => {
        // Remove from store after successful archive
        removeTodo(id);
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      },
    });
  };

  /**
   * Restore an archived todo
   */
  const useRestoreTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => api.restoreTodo(id),
      onMutate: (id) => {
        addPendingId(id);
      },
      onSuccess: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
      },
      onError: (_, id) => {
        removePendingId(id);
      },
    });
  };

  /**
   * Update todo status (for drag & drop)
   */
  const useUpdateStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        api.updateTodo(id, { status: status as any }),
      onMutate: async ({ id, status }) => {
        addPendingId(id);
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
        updateTodoInStore(id, { status: status as any });
      },
      onSuccess: (_, { id }) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, { id }) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      },
    });
  };

  // ============================================
  // Bulk Operations
  // ============================================

  /**
   * Bulk archive multiple TODOs
   */
  const useBulkArchive = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (ids: string[]) => api.bulkArchive(ids),
      onMutate: async (ids) => {
        ids.forEach((id) => addPendingId(id));
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
      },
      onSuccess: (_, ids) => {
        ids.forEach((id) => {
          removeTodo(id);
          removePendingId(id);
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
      },
    });
  };

  /**
   * Bulk restore multiple archived TODOs
   */
  const useBulkRestore = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (ids: string[]) => api.bulkRestore(ids),
      onMutate: async (ids) => {
        ids.forEach((id) => addPendingId(id));
      },
      onSuccess: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
      },
    });
  };

  /**
   * Bulk delete multiple TODOs
   */
  const useBulkDelete = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (ids: string[]) => api.bulkDelete(ids),
      onMutate: async (ids) => {
        ids.forEach((id) => addPendingId(id));
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
        await queryClient.cancelQueries({ queryKey: todoKeys.archived() });
        ids.forEach((id) => removeTodo(id));
      },
      onSuccess: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
      },
    });
  };

  return {
    // Queries
    useTodos,
    useArchivedTodos,
    useTodo,
    useStatistics,
    // Mutations
    useCreateTodo,
    useUpdateTodo,
    useDeleteTodo,
    useArchiveTodo,
    useRestoreTodo,
    useUpdateStatus,
    // Bulk Operations
    useBulkArchive,
    useBulkRestore,
    useBulkDelete,
  };
};

// ============================================
// Types
// ============================================
export type TodoHooks = ReturnType<typeof createTodoHooks>;


import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { HttpStart } from "../../../../../src/core/public";
import { TodosApiService } from "../services";
import {
  TodoItem,
  TodoSearchParams,
  CreateTodoRequest,
  UpdateTodoRequest,
  PaginatedResponse,
} from "../../common/types";

// ============================================
// Query Keys
// ============================================
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (params: TodoSearchParams) => [...todoKeys.lists(), params] as const,
  archived: () => [...todoKeys.all, "archived"] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
  statistics: () => [...todoKeys.all, "statistics"] as const,
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
export const createTodoHooks = (
  http: HttpStart,
  storeActions: StoreActions
) => {
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
   * Fetch archived todos with pagination
   */
  const useArchivedTodos = (
    params: {
      page?: number;
      size?: number;
      sortField?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) => {
    const {
      page = 1,
      size = 25,
      sortField = "archivedAt",
      sortOrder = "desc",
    } = params;

    return useQuery({
      queryKey: [...todoKeys.archived(), { page, size, sortField, sortOrder }],
      queryFn: async () => {
        const response = await api.searchTodos({
          archived: true,
          page,
          size,
          sortField,
          sortOrder,
        });
        setArchivedTodos(response.items);
        return response;
      },
      staleTime: 30000,
    });
  };

  /**
   * Get archived todos count (for tab badge)
   */
  const useArchivedCount = () => {
    return useQuery({
      queryKey: [...todoKeys.archived(), "count"],
      queryFn: async () => {
        // Just get 1 item to get the total count
        const response = await api.searchTodos({
          archived: true,
          page: 1,
          size: 1,
        });
        return response.total;
      },
      staleTime: 60000, // Cache for 1 minute
    });
  };

  /**
   * Infinite scroll query for Kanban board
   * Fetches todos in pages as user scrolls, ordered by position
   */
  const useInfiniteKanban = (pageSize: number = 50) => {
    return useInfiniteQuery<PaginatedResponse<TodoItem>>(
      [...todoKeys.all, "kanban", { pageSize }],
      async ({ pageParam = 1 }) => {
        const response = await api.searchTodos({
          archived: false,
          page: pageParam as number,
          size: pageSize,
          sortField: "position",
          sortOrder: "asc",
        });
        return response;
      },
      {
        getNextPageParam: (lastPage, allPages) => {
          const totalLoaded = allPages.length * pageSize;
          if (totalLoaded < lastPage.total) {
            return allPages.length + 1;
          }
          return undefined;
        },
        staleTime: 30000,
        refetchOnWindowFocus: true,
      }
    );
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
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, { id }) => {
        removePendingId(id); // Clear pending state on error
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        await queryClient.cancelQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        removeTodo(id);
      },
      onSuccess: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        await queryClient.cancelQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
      },
      onSuccess: (_, id) => {
        // Remove from store after successful archive
        removeTodo(id);
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, id) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
      },
      onError: (_, id) => {
        removePendingId(id);
      },
    });
  };

  /**
   * Reorder todo (for drag & drop) - updates status and position
   * Uses optimistic update for both store and infinite query cache
   */
  const useReorderTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({
        id,
        status,
        position,
      }: {
        id: string;
        status: string;
        position: number;
      }) => api.reorderTodo(id, status, position),
      onMutate: async ({ id, status, position }) => {
        addPendingId(id);

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
        await queryClient.cancelQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });

        // Update the store (for non-kanban views)
        updateTodoInStore(id, { status: status as any, position });

        // Optimistically update the infinite query cache for Kanban
        const kanbanQueryKey = [...todoKeys.all, "kanban"];
        const previousKanbanData = queryClient.getQueriesData({
          queryKey: kanbanQueryKey,
        });

        queryClient.setQueriesData(
          { queryKey: kanbanQueryKey },
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.map((item: TodoItem) =>
                  item.id === id
                    ? { ...item, status: status as any, position }
                    : item
                ),
              })),
            };
          }
        );

        return { previousKanbanData };
      },
      onSuccess: (_, { id }) => {
        removePendingId(id);
        // Don't invalidate immediately - let optimistic update stay
        // Only invalidate statistics
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, { id }, context) => {
        removePendingId(id);

        // Restore previous kanban data on error
        if (context?.previousKanbanData) {
          context.previousKanbanData.forEach(([queryKey, data]) => {
            queryClient.setQueryData(queryKey, data);
          });
        }

        // Refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
      },
    });
  };

  /**
   * Update todo status only (for dropdown/inline status changes)
   * Unlike useReorderTodo, this invalidates queries to refresh the UI
   */
  const useUpdateStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        api.reorderTodo(id, status, Date.now()),
      onMutate: async ({ id, status }) => {
        addPendingId(id);

        await queryClient.cancelQueries({ queryKey: todoKeys.lists() });
        await queryClient.cancelQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });

        updateTodoInStore(id, { status: status as any });

        // Optimistically update list queries cache
        queryClient.setQueriesData(
          { queryKey: todoKeys.lists() },
          (oldData: any) => {
            if (!oldData?.items) return oldData;
            return {
              ...oldData,
              items: oldData.items.map((item: TodoItem) =>
                item.id === id ? { ...item, status: status as any } : item
              ),
            };
          }
        );

        // Optimistically update kanban cache
        queryClient.setQueriesData(
          { queryKey: [...todoKeys.all, "kanban"] },
          (oldData: any) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.map((item: TodoItem) =>
                  item.id === id ? { ...item, status: status as any } : item
                ),
              })),
            };
          }
        );
      },
      onSuccess: (_, { id }) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, { id }) => {
        removePendingId(id);
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        await queryClient.cancelQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
      },
      onSuccess: (_, ids) => {
        ids.forEach((id) => {
          removeTodo(id);
          removePendingId(id);
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
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
        await queryClient.cancelQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        await queryClient.cancelQueries({ queryKey: todoKeys.archived() });
        ids.forEach((id) => removeTodo(id));
      },
      onSuccess: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
        queryClient.invalidateQueries({ queryKey: todoKeys.statistics() });
      },
      onError: (_, ids) => {
        ids.forEach((id) => removePendingId(id));
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: [...todoKeys.all, "kanban"],
        });
        queryClient.invalidateQueries({ queryKey: todoKeys.archived() });
      },
    });
  };

  return {
    // Queries
    useTodos,
    useArchivedTodos,
    useArchivedCount,
    useInfiniteKanban,
    useTodo,
    useStatistics,
    // Mutations
    useCreateTodo,
    useUpdateTodo,
    useDeleteTodo,
    useArchiveTodo,
    useRestoreTodo,
    useUpdateStatus,
    useReorderTodo,
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

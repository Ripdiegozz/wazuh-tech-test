import { useMemo, useCallback } from "react";
import { CoreStart } from "../../../../../src/core/public";
import { TodoItem, TodoStatus, ComplianceStandard } from "../../common/types";

interface UseTodoAppLogicParams {
  notifications: CoreStart["notifications"];
  // Mutations
  createMutation: { mutateAsync: (data: any) => Promise<any> };
  deleteMutation: { mutateAsync: (id: string) => Promise<any> };
  archiveMutation: { mutateAsync: (id: string) => Promise<any> };
  restoreMutation: { mutateAsync: (id: string) => Promise<any> };
  updateStatusMutation: {
    mutateAsync: (params: { id: string; status: TodoStatus }) => Promise<any>;
  };
  reorderMutation: {
    mutateAsync: (params: {
      id: string;
      status: TodoStatus;
      position: number;
    }) => Promise<any>;
  };
  bulkArchiveMutation: { mutateAsync: (ids: string[]) => Promise<any> };
  bulkRestoreMutation: { mutateAsync: (ids: string[]) => Promise<any> };
  bulkDeleteMutation: { mutateAsync: (ids: string[]) => Promise<any> };
}

export const useTodoHandlers = ({
  notifications,
  createMutation,
  deleteMutation,
  archiveMutation,
  restoreMutation,
  updateStatusMutation,
  reorderMutation,
  bulkArchiveMutation,
  bulkRestoreMutation,
  bulkDeleteMutation,
}: UseTodoAppLogicParams) => {
  const handleSaveTodo = useCallback(
    async (data: any) => {
      try {
        await createMutation.mutateAsync(data);
        notifications.toasts.addSuccess("TODO created");
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [createMutation, notifications]
  );

  const handleDeleteTodo = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        notifications.toasts.addSuccess("TODO deleted");
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [deleteMutation, notifications]
  );

  const handleArchiveTodo = useCallback(
    async (id: string) => {
      try {
        await archiveMutation.mutateAsync(id);
        notifications.toasts.addSuccess("TODO archived");
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [archiveMutation, notifications]
  );

  const handleRestoreTodo = useCallback(
    async (id: string) => {
      try {
        await restoreMutation.mutateAsync(id);
        notifications.toasts.addSuccess("TODO restored");
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [restoreMutation, notifications]
  );

  const handleStatusChange = useCallback(
    async (id: string, status: TodoStatus) => {
      try {
        await updateStatusMutation.mutateAsync({ id, status });
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [updateStatusMutation, notifications]
  );

  const handleReorder = useCallback(
    async (id: string, status: TodoStatus, position: number) => {
      try {
        await reorderMutation.mutateAsync({ id, status, position });
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [reorderMutation, notifications]
  );

  const handleBulkArchive = useCallback(
    async (ids: string[]) => {
      try {
        await bulkArchiveMutation.mutateAsync(ids);
        notifications.toasts.addSuccess(
          `${ids.length} item${ids.length > 1 ? "s" : ""} archived`
        );
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [bulkArchiveMutation, notifications]
  );

  const handleBulkRestore = useCallback(
    async (ids: string[]) => {
      try {
        await bulkRestoreMutation.mutateAsync(ids);
        notifications.toasts.addSuccess(
          `${ids.length} item${ids.length > 1 ? "s" : ""} restored`
        );
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [bulkRestoreMutation, notifications]
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      try {
        await bulkDeleteMutation.mutateAsync(ids);
        notifications.toasts.addSuccess(
          `${ids.length} item${ids.length > 1 ? "s" : ""} deleted`
        );
      } catch (error) {
        notifications.toasts.addDanger({
          title: "Error",
          text: (error as Error).message,
        });
      }
    },
    [bulkDeleteMutation, notifications]
  );

  return {
    handleSaveTodo,
    handleDeleteTodo,
    handleArchiveTodo,
    handleRestoreTodo,
    handleStatusChange,
    handleReorder,
    handleBulkArchive,
    handleBulkRestore,
    handleBulkDelete,
  };
};

// Hook for Kanban data filtering and grouping
interface UseKanbanDataParams {
  kanbanInfiniteData: { pages?: { items: TodoItem[]; total: number }[] } | undefined;
  searchQuery: string | undefined;
  priorityFilter: string;
  complianceFilters: ComplianceStandard[];
  statusFilters: TodoStatus[];
}

export const useKanbanData = ({
  kanbanInfiniteData,
  searchQuery,
  priorityFilter,
  complianceFilters,
  statusFilters,
}: UseKanbanDataParams) => {
  // Flatten all pages from infinite query
  const allKanbanTodos = useMemo(() => {
    if (!kanbanInfiniteData?.pages) return [];
    return kanbanInfiniteData.pages.flatMap((page) => page.items);
  }, [kanbanInfiniteData]);

  // Total count from first page
  const kanbanTotalCount = kanbanInfiniteData?.pages?.[0]?.total || 0;

  // Apply client-side filters
  const filteredKanbanTodos = useMemo(() => {
    return allKanbanTodos.filter((todo) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = todo.title.toLowerCase().includes(query);
        const descMatch =
          todo.description?.toLowerCase().includes(query) || false;
        if (!titleMatch && !descMatch) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) {
        return false;
      }

      // Compliance filter
      if (complianceFilters.length > 0) {
        const hasMatchingCompliance = todo.complianceStandards?.some(
          (standard) => complianceFilters.includes(standard)
        );
        if (!hasMatchingCompliance) return false;
      }

      return true;
    });
  }, [allKanbanTodos, searchQuery, priorityFilter, complianceFilters]);

  // Group by status and sort by position
  const kanbanTodosByStatus = useMemo(() => {
    const grouped: Record<TodoStatus, TodoItem[]> = {
      [TodoStatus.PLANNED]: [],
      [TodoStatus.IN_PROGRESS]: [],
      [TodoStatus.BLOCKED]: [],
      [TodoStatus.COMPLETED_SUCCESS]: [],
      [TodoStatus.COMPLETED_ERROR]: [],
    };

    filteredKanbanTodos.forEach((todo) => {
      if (grouped[todo.status]) {
        grouped[todo.status].push(todo);
      }
    });

    // Sort each column by position
    Object.keys(grouped).forEach((status) => {
      grouped[status as TodoStatus].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
    });

    return grouped;
  }, [filteredKanbanTodos]);

  // Apply status filter (hide columns if filtered)
  const todosByStatus = useMemo(() => {
    if (statusFilters.length === 0) {
      return kanbanTodosByStatus;
    }

    const filtered: Record<TodoStatus, TodoItem[]> = {
      [TodoStatus.PLANNED]: [],
      [TodoStatus.IN_PROGRESS]: [],
      [TodoStatus.BLOCKED]: [],
      [TodoStatus.COMPLETED_SUCCESS]: [],
      [TodoStatus.COMPLETED_ERROR]: [],
    };

    statusFilters.forEach((status) => {
      filtered[status] = kanbanTodosByStatus[status] || [];
    });

    return filtered;
  }, [kanbanTodosByStatus, statusFilters]);

  // Count todos by status (unfiltered)
  const statusCounts = useMemo(() => {
    const counts: Record<TodoStatus, number> = {
      [TodoStatus.PLANNED]: 0,
      [TodoStatus.IN_PROGRESS]: 0,
      [TodoStatus.BLOCKED]: 0,
      [TodoStatus.COMPLETED_SUCCESS]: 0,
      [TodoStatus.COMPLETED_ERROR]: 0,
    };

    allKanbanTodos.forEach((todo) => {
      if (counts[todo.status] !== undefined) {
        counts[todo.status]++;
      }
    });

    return counts;
  }, [allKanbanTodos]);

  // Count by compliance standard
  const complianceCounts = useMemo(() => {
    const counts: Record<ComplianceStandard, number> = {
      [ComplianceStandard.PCI_DSS]: 0,
      [ComplianceStandard.ISO_27001]: 0,
      [ComplianceStandard.SOX]: 0,
      [ComplianceStandard.HIPAA]: 0,
      [ComplianceStandard.GDPR]: 0,
      [ComplianceStandard.NIST]: 0,
    };

    allKanbanTodos.forEach((todo) => {
      todo.complianceStandards?.forEach((standard) => {
        if (counts[standard] !== undefined) {
          counts[standard]++;
        }
      });
    });

    return counts;
  }, [allKanbanTodos]);

  return {
    allKanbanTodos,
    kanbanTotalCount,
    todosByStatus,
    statusCounts,
    complianceCounts,
  };
};


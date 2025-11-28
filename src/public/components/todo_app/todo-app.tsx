import * as React from "react";
import { useMemo, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiTourStep,
} from "@elastic/eui";
import { CoreStart } from "../../../../../../src/core/public";
import {
  createTodoHooks,
  StoreActions,
  useKeyboardShortcuts,
  useDebouncedSearch,
  useUrlFilters,
  useTodoHandlers,
  useKanbanData,
} from "../../hooks";
import { useTodoStore } from "../../stores";
import { useTodoTour } from "./shared";
import { TodoStatus, ComplianceStandard } from "../../../common/types";
import { KanbanBoard } from "./kanban-board";
import { TableView } from "./table-view";
import { ArchivedView } from "./archived-view";
import { StatsDashboard } from "./stats-dashboard";
import { TodoModal } from "./todo-modal";
import { TodoDetailPanel } from "./todo-detail-panel";
import { TodoNavTabs } from "./todo-nav-tabs";
import { TodoToolbar } from "./todo-toolbar";
// @ts-ignore
import "../../styles/todo_app.scss";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface TodoAppProps {
  basename: string;
  notifications: CoreStart["notifications"];
  http: CoreStart["http"];
}

const TodoAppContent: React.FC<TodoAppProps> = ({ notifications, http }) => {
  // URL sync for filters
  const { initialFilters, syncToUrl } = useUrlFilters();

  const [priorityFilter, setPriorityFilter] = useState<string>(
    initialFilters.priority || "all"
  );
  const [complianceFilters, setComplianceFilters] = useState<
    ComplianceStandard[]
  >([]);

  // Toggle compliance filter
  const toggleComplianceFilter = useCallback(
    (standard: ComplianceStandard) => {
      setComplianceFilters((prev) =>
        prev.includes(standard)
          ? prev.filter((s) => s !== standard)
          : [...prev, standard]
      );
    },
    []
  );

  // Pagination & Sorting state for Table View
  const [tablePageIndex, setTablePageIndex] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(25);
  const [tableSortField, setTableSortField] = useState("updatedAt");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">(
    "desc"
  );

  // Pagination & Sorting state for Archived View
  const [archivedPageIndex, setArchivedPageIndex] = useState(0);
  const [archivedPageSize, setArchivedPageSize] = useState(25);
  const [archivedSortField, setArchivedSortField] = useState("archivedAt");
  const [archivedSortDirection, setArchivedSortDirection] = useState<
    "asc" | "desc"
  >("desc");

  // Tour state
  const { tourSteps, actions: tourActions } = useTodoTour();

  // Get store state and actions
  const store = useTodoStore();
  const {
    currentView,
    setView,
    filters,
    setFilters,
    toggleStatusFilter,
    isModalOpen,
    openCreateModal,
    closeModal,
    detailPanelTodo,
    openDetailPanel,
    closeDetailPanel,
    setTodos,
    setArchivedTodos,
    addTodo,
    updateTodoInStore,
    removeTodo,
    setLoading,
    addPendingId,
    removePendingId,
    isPending,
  } = store;

  // Debounce search query (300ms delay, immediate clear when empty)
  const debouncedQuery = useDebouncedSearch(filters.query, 300);

  const storeActions: StoreActions = useMemo(
    () => ({
      setTodos,
      setArchivedTodos,
      addTodo,
      updateTodoInStore,
      removeTodo,
      setLoading,
      closeModal,
      addPendingId,
      removePendingId,
    }),
    [
      setTodos,
      setArchivedTodos,
      addTodo,
      updateTodoInStore,
      removeTodo,
      setLoading,
      closeModal,
      addPendingId,
      removePendingId,
    ]
  );

  const todoHooks = useMemo(
    () => createTodoHooks(http, storeActions),
    [http, storeActions]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // React Query hooks
  const {
    useTodos,
    useArchivedTodos,
    useArchivedCount,
    useInfiniteKanban,
    useStatistics,
    useCreateTodo,
    useUpdateTodo,
    useDeleteTodo,
    useArchiveTodo,
    useRestoreTodo,
    useUpdateStatus,
    useReorderTodo,
    useBulkArchive,
    useBulkRestore,
    useBulkDelete,
  } = todoHooks;

  // Build search params with debounced query
  const searchQuery = debouncedQuery.trim() || undefined;

  // Fetch todos with pagination and sorting (server-side) - for Table View
  const { data: todosData, isLoading: todosLoading } = useTodos({
    query: searchQuery,
    status: filters.status.length > 0 ? filters.status : undefined,
    priority:
      priorityFilter !== "all" ? [priorityFilter as any] : undefined,
    assignee: filters.assignee || undefined,
    page: tablePageIndex + 1,
    size: tablePageSize,
    sortField: tableSortField,
    sortOrder: tableSortDirection,
  });

  // Infinite query for Kanban Board
  const {
    data: kanbanInfiniteData,
    fetchNextPage: fetchMoreKanban,
    hasNextPage: hasMoreKanbanData,
    isFetchingNextPage: isFetchingMoreKanban,
    isLoading: kanbanLoading,
  } = useInfiniteKanban(50);

  // Fetch archived todos with pagination and sorting (server-side)
  const { data: archivedData, isLoading: archivedLoading } = useArchivedTodos({
    page: archivedPageIndex + 1,
    size: archivedPageSize,
    sortField: archivedSortField,
    sortOrder: archivedSortDirection,
  });

  // Get archived count for badge
  const { data: archivedCount = 0 } = useArchivedCount();

  const { data: statisticsData, isLoading: statsLoading } = useStatistics();

  // Mutations
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();
  const deleteMutation = useDeleteTodo();
  const archiveMutation = useArchiveTodo();
  const restoreMutation = useRestoreTodo();
  const updateStatusMutation = useUpdateStatus();
  const reorderMutation = useReorderTodo();
  const bulkArchiveMutation = useBulkArchive();
  const bulkRestoreMutation = useBulkRestore();
  const bulkDeleteMutation = useBulkDelete();

  // Use extracted handlers hook
  const {
    handleSaveTodo,
    handleDeleteTodo,
    handleArchiveTodo,
    handleRestoreTodo,
    handleStatusChange,
    handleReorder,
    handleBulkArchive,
    handleBulkRestore,
    handleBulkDelete,
  } = useTodoHandlers({
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
  });

  // Use extracted Kanban data hook
  const {
    allKanbanTodos,
    kanbanTotalCount,
    todosByStatus,
    statusCounts,
    complianceCounts,
  } = useKanbanData({
    kanbanInfiniteData,
    searchQuery,
    priorityFilter,
    complianceFilters,
    statusFilters: filters.status,
  });

  // Pagination handlers
  const handleTablePaginationChange = useCallback(
    (newPageIndex: number, newPageSize: number) => {
      setTablePageIndex(newPageIndex);
      setTablePageSize(newPageSize);
    },
    []
  );

  const handleArchivedPaginationChange = useCallback(
    (page: number, size: number) => {
      setArchivedPageIndex(page);
      setArchivedPageSize(size);
    },
    []
  );

  // Sorting handlers
  const handleTableSortChange = useCallback(
    (field: string, direction: "asc" | "desc") => {
      setTableSortField(field);
      setTableSortDirection(direction);
      setTablePageIndex(0);
    },
    []
  );

  const handleArchivedSortChange = useCallback(
    (field: string, direction: "asc" | "desc") => {
      setArchivedSortField(field);
      setArchivedSortDirection(direction);
      setArchivedPageIndex(0);
    },
    []
  );

  // Reset pagination when filters change
  React.useEffect(() => {
    setTablePageIndex(0);
  }, [searchQuery, priorityFilter, filters.status]);

  // Initialize from URL
  React.useEffect(() => {
    if (initialFilters.view) {
      setView(initialFilters.view as any);
    }
    if (initialFilters.query) {
      setFilters({ query: initialFilters.query });
    }
    if (initialFilters.status && initialFilters.status.length > 0) {
      setFilters({ status: initialFilters.status });
    }
  }, []); // Run only once on mount

  // Sync filters to URL when they change
  React.useEffect(() => {
    syncToUrl({
      view: currentView,
      query: filters.query || undefined,
      status: filters.status.length > 0 ? filters.status : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
    });
  }, [currentView, filters.query, filters.status, priorityFilter, syncToUrl]);

  // Table and archived data
  const tableItems = todosData?.items || [];
  const tableTotalItems = todosData?.total || 0;
  const archivedItems = archivedData?.items || [];
  const archivedTotalItems = archivedData?.total || 0;

  return (
    <div className="todo-app">
      {/* Navigation */}
      <TodoNavTabs
        currentView={currentView}
        onViewChange={setView}
        archivedCount={archivedCount}
        tourSteps={{ step1: tourSteps.step1, step3: tourSteps.step3 }}
        tourActions={tourActions}
      />

      {/* Content */}
      <main className="todo-app__content">
        {/* Toolbar - only for board and table views */}
        {currentView !== "archived" && currentView !== "stats" && (
          <TodoToolbar
            searchQuery={filters.query}
            onSearchChange={(query) => setFilters({ query })}
            showStatusFilters={currentView === "board"}
            statusFilters={filters.status}
            onToggleStatusFilter={toggleStatusFilter}
            statusCounts={statusCounts}
            complianceFilters={complianceFilters}
            onToggleComplianceFilter={toggleComplianceFilter}
            complianceCounts={complianceCounts}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            onCreateClick={openCreateModal}
            tourSteps={{ step2: tourSteps.step2, step4: tourSteps.step4 }}
            tourActions={tourActions}
          />
        )}

        {/* View Content */}
        {(currentView === "board" && kanbanLoading) ||
        (currentView === "table" && todosLoading) ? (
          <EuiFlexGroup justifyContent="center" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <>
            {currentView === "board" && (
              <EuiTourStep
                {...tourSteps.step5}
                footerAction={
                  <EuiButton
                    size="s"
                    color="primary"
                    onClick={() => tourActions.finishTour()}
                  >
                    Get Started!
                  </EuiButton>
                }
              >
                <KanbanBoard
                  todosByStatus={todosByStatus}
                  statusLabels={{
                    [TodoStatus.PLANNED]: "To Do",
                    [TodoStatus.IN_PROGRESS]: "In Progress",
                    [TodoStatus.BLOCKED]: "Blocked",
                    [TodoStatus.COMPLETED_SUCCESS]: "Done",
                    [TodoStatus.COMPLETED_ERROR]: "Error",
                  }}
                  onEditTodo={openDetailPanel}
                  onReorder={handleReorder}
                  onArchiveTodo={handleArchiveTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onCreateInStatus={openCreateModal}
                  isPending={isPending}
                  hasMore={hasMoreKanbanData || false}
                  isLoadingMore={isFetchingMoreKanban}
                  onLoadMore={fetchMoreKanban}
                  totalCount={kanbanTotalCount}
                  loadedCount={allKanbanTodos.length}
                />
              </EuiTourStep>
            )}
            {currentView === "table" && (
              <TableView
                todos={tableItems}
                totalItems={tableTotalItems}
                pageIndex={tablePageIndex}
                pageSize={tablePageSize}
                sortField={tableSortField}
                sortDirection={tableSortDirection}
                isLoading={todosLoading}
                onPaginationChange={handleTablePaginationChange}
                onSortChange={handleTableSortChange}
                onEditTodo={openDetailPanel}
                onDeleteTodo={handleDeleteTodo}
                onArchiveTodo={handleArchiveTodo}
                onStatusChange={handleStatusChange}
                onBulkArchive={handleBulkArchive}
                onBulkDelete={handleBulkDelete}
                isPending={isPending}
              />
            )}
            {currentView === "archived" && (
              <ArchivedView
                todos={archivedItems}
                totalItems={archivedTotalItems}
                pageIndex={archivedPageIndex}
                pageSize={archivedPageSize}
                sortField={archivedSortField}
                sortDirection={archivedSortDirection}
                isLoading={archivedLoading}
                onPaginationChange={handleArchivedPaginationChange}
                onSortChange={handleArchivedSortChange}
                onRestoreTodo={handleRestoreTodo}
                onDeleteTodo={handleDeleteTodo}
                onBulkRestore={handleBulkRestore}
                onBulkDelete={handleBulkDelete}
                isPending={isPending}
              />
            )}
            {currentView === "stats" && (
              <StatsDashboard
                statistics={statisticsData}
                isLoading={statsLoading}
              />
            )}
          </>
        )}
      </main>

      {/* Todo Modal (Create only) */}
      {isModalOpen && (
        <TodoModal onSave={handleSaveTodo} onClose={closeModal} />
      )}

      {/* Todo Detail Panel (Preview with inline edit) */}
      {detailPanelTodo && (
        <TodoDetailPanel
          todo={detailPanelTodo}
          onClose={closeDetailPanel}
          onUpdate={async (id, updates) => {
            await updateMutation.mutateAsync({ id, data: updates });
          }}
          onArchive={handleArchiveTodo}
          onDelete={handleDeleteTodo}
        />
      )}
    </div>
  );
};

export const TodoApp: React.FC<TodoAppProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoAppContent {...props} />
    </QueryClientProvider>
  );
};

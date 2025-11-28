import * as React from 'react';
import { useMemo, useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  EuiIcon,
  EuiFieldSearch,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFilterGroup,
  EuiFilterButton,
  EuiSuperSelect,
  EuiLoadingSpinner,
  EuiButtonIcon,
  EuiToolTip,
  EuiPopover,
  EuiText,
  EuiSpacer,
  EuiLink,
  EuiTourStep,
} from '@elastic/eui';
import { CoreStart } from '../../../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../../../src/plugins/navigation/public';
import { createTodoHooks, StoreActions } from '../../hooks';
import { useTodoStore } from '../../stores';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS_HELP, SEARCH_INPUT_ID, useDebouncedSearch, useUrlFilters } from '../../hooks';
import { useTodoTour } from './shared';
import { TodoItem, TodoStatus, TodoPriority } from '../../../common/types';
import { KanbanBoard } from './kanban-board';
import { TableView } from './table-view';
import { ArchivedView } from './archived-view';
import { StatsDashboard } from './stats-dashboard';
import { TodoModal } from './todo-modal';
import { TodoDetailPanel } from './todo-detail-panel';
import '../../styles/todo_app.scss';

// Create QueryClient outside component
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
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: 'To Do',
  [TodoStatus.IN_PROGRESS]: 'In Progress',
  [TodoStatus.BLOCKED]: 'Blocked',
  [TodoStatus.COMPLETED_SUCCESS]: 'Done',
  [TodoStatus.COMPLETED_ERROR]: 'Error',
};

const PRIORITY_OPTIONS = [
  { value: 'all', inputDisplay: 'All Priorities' },
  { value: TodoPriority.LOW, inputDisplay: 'Low' },
  { value: TodoPriority.MEDIUM, inputDisplay: 'Medium' },
  { value: TodoPriority.HIGH, inputDisplay: 'High' },
  { value: TodoPriority.CRITICAL, inputDisplay: 'Critical' },
];

// Helper to format archived count badge
const formatBadgeCount = (count: number): string => {
  return count > 99 ? '99+' : String(count);
};

const TodoAppContent: React.FC<TodoAppProps> = ({
  notifications,
  http,
}) => {
  // URL sync for filters
  const { initialFilters, syncToUrl } = useUrlFilters();
  
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
  const [priorityFilter, setPriorityFilter] = React.useState<string>(initialFilters.priority || 'all');
  
  // Pagination & Sorting state for Table View
  const [tablePageIndex, setTablePageIndex] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(25);
  const [tableSortField, setTableSortField] = useState('updatedAt');
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination & Sorting state for Archived View
  const [archivedPageIndex, setArchivedPageIndex] = useState(0);
  const [archivedPageSize, setArchivedPageSize] = useState(25);
  const [archivedSortField, setArchivedSortField] = useState('archivedAt');
  const [archivedSortDirection, setArchivedSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Tour state
  const { tourSteps, actions: tourActions, isTourActive } = useTodoTour();
  
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
    // Detail Panel
    detailPanelTodo,
    openDetailPanel,
    closeDetailPanel,
    archivedTodos,
    setTodos,
    setArchivedTodos,
    addTodo,
    updateTodoInStore,
    removeTodo,
    setLoading,
    // Pending state
    addPendingId,
    removePendingId,
    isPending,
  } = store;

  // Debounce search query (300ms delay, immediate clear when empty)
  const debouncedQuery = useDebouncedSearch(filters.query, 300);

  // Create store actions object for React Query hooks
  const storeActions: StoreActions = useMemo(() => ({
    setTodos,
    setArchivedTodos,
    addTodo,
    updateTodoInStore,
    removeTodo,
    setLoading,
    closeModal,
    addPendingId,
    removePendingId,
  }), [setTodos, setArchivedTodos, addTodo, updateTodoInStore, removeTodo, setLoading, closeModal, addPendingId, removePendingId]);

  // Create hooks with http and store actions
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
  // Empty string or whitespace = undefined (load all without query filter)
  const searchQuery = debouncedQuery.trim() || undefined;
  
  // Fetch todos with pagination and sorting (server-side) - for Table View
  const { data: todosData, isLoading: todosLoading } = useTodos({
    query: searchQuery,
    status: filters.status.length > 0 ? filters.status : undefined,
    priority: priorityFilter !== 'all' ? [priorityFilter as TodoPriority] : undefined,
    assignee: filters.assignee || undefined,
    page: tablePageIndex + 1, // API uses 1-based pages
    size: tablePageSize,
    sortField: tableSortField,
    sortOrder: tableSortDirection,
  });

  // Infinite query for Kanban Board - fetches all data progressively
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

  // Pagination handlers
  const handleTablePaginationChange = useCallback((newPageIndex: number, newPageSize: number) => {
    setTablePageIndex(newPageIndex);
    setTablePageSize(newPageSize);
  }, []);

  const handleArchivedPaginationChange = useCallback((page: number, size: number) => {
    setArchivedPageIndex(page);
    setArchivedPageSize(size);
  }, []);

  // Sorting handlers - reset to page 0 when sort changes (server-side sorting)
  const handleTableSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setTableSortField(field);
    setTableSortDirection(direction);
    setTablePageIndex(0); // Reset to first page on sort change
  }, []);

  const handleArchivedSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setArchivedSortField(field);
    setArchivedSortDirection(direction);
    setArchivedPageIndex(0); // Reset to first page on sort change
  }, []);

  // Reset pagination when filters change
  React.useEffect(() => {
    setTablePageIndex(0);
  }, [searchQuery, priorityFilter, filters.status]);

  // Initialize from URL on mount
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
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    });
  }, [currentView, filters.query, filters.status, priorityFilter, syncToUrl]);

  // Handlers
  const handleSaveTodo = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      notifications.toasts.addSuccess('TODO created');
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      notifications.toasts.addSuccess('TODO deleted');
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleArchiveTodo = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      notifications.toasts.addSuccess('TODO archived');
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleRestoreTodo = async (id: string) => {
    try {
      await restoreMutation.mutateAsync(id);
      notifications.toasts.addSuccess('TODO restored');
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleStatusChange = async (id: string, status: TodoStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleReorder = async (id: string, status: TodoStatus, position: number) => {
    try {
      await reorderMutation.mutateAsync({ id, status, position });
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  // Bulk operation handlers
  const handleBulkArchive = async (ids: string[]) => {
    try {
      await bulkArchiveMutation.mutateAsync(ids);
      notifications.toasts.addSuccess(`${ids.length} item${ids.length > 1 ? 's' : ''} archived`);
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleBulkRestore = async (ids: string[]) => {
    try {
      await bulkRestoreMutation.mutateAsync(ids);
      notifications.toasts.addSuccess(`${ids.length} item${ids.length > 1 ? 's' : ''} restored`);
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      notifications.toasts.addSuccess(`${ids.length} item${ids.length > 1 ? 's' : ''} deleted`);
    } catch (error) {
      notifications.toasts.addDanger({
        title: 'Error',
        text: (error as Error).message,
      });
    }
  };

  // Flatten all pages from infinite query into a single array for Kanban
  const allKanbanTodos = useMemo(() => {
    if (!kanbanInfiniteData?.pages) return [];
    return kanbanInfiniteData.pages.flatMap((page) => page.items);
  }, [kanbanInfiniteData]);

  // Get total count for Kanban (from first page)
  const kanbanTotalCount = kanbanInfiniteData?.pages?.[0]?.total || 0;
  
  // Apply CLIENT-SIDE filters to Kanban data
  const filteredKanbanTodos = useMemo(() => {
    return allKanbanTodos.filter((todo) => {
      // Search filter (title & description) - client-side
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = todo.title.toLowerCase().includes(query);
        const descMatch = todo.description?.toLowerCase().includes(query) || false;
        if (!titleMatch && !descMatch) return false;
      }
      
      // Priority filter - client-side
      if (priorityFilter !== 'all' && todo.priority !== priorityFilter) {
        return false;
      }
      
      return true;
    });
  }, [allKanbanTodos, searchQuery, priorityFilter]);

  // Group filtered Kanban todos by status and sort by position
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
    
    // Sort each column by position (ascending)
    Object.keys(grouped).forEach((status) => {
      grouped[status as TodoStatus].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });
    
    return grouped;
  }, [filteredKanbanTodos]);
  
  // Apply status filter to Kanban (hide empty columns if filtered)
  const todosByStatus = useMemo(() => {
    // If no status filters selected, show all statuses
    if (filters.status.length === 0) {
      return kanbanTodosByStatus;
    }
    
    // Otherwise, only show the selected statuses (empty arrays for unselected)
    const filtered: Record<TodoStatus, TodoItem[]> = {
      [TodoStatus.PLANNED]: [],
      [TodoStatus.IN_PROGRESS]: [],
      [TodoStatus.BLOCKED]: [],
      [TodoStatus.COMPLETED_SUCCESS]: [],
      [TodoStatus.COMPLETED_ERROR]: [],
    };
    
    filters.status.forEach((status) => {
      filtered[status] = kanbanTodosByStatus[status] || [];
    });
    
    return filtered;
  }, [kanbanTodosByStatus, filters.status]);

  // Count todos by status (unfiltered) for filter badges
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

  // Get flat list of filtered todos for table view (already paginated from server)
  const tableItems = todosData?.items || [];
  const tableTotalItems = todosData?.total || 0;

  // Archived todos (already paginated from server)
  const archivedItems = archivedData?.items || [];
  const archivedTotalItems = archivedData?.total || 0;

  return (
    <div className="todo-app">
      {/* Header */}
      <EuiTourStep
        {...tourSteps.step1}
        footerAction={
          <EuiButton size="s" color="primary" onClick={() => tourActions.goToStep(2)}>
            Next
          </EuiButton>
        }
      >
      <header className="todo-app__header">
        <h1>
          <EuiIcon type="listAdd" size="l" />
          Security TODO Manager
        </h1>
      </header>
      </EuiTourStep>

      {/* Navigation Tabs */}
      <EuiTourStep
        {...tourSteps.step3}
        footerAction={
          <EuiButton size="s" color="primary" onClick={() => tourActions.goToStep(4)}>
            Next
          </EuiButton>
        }
      >
      <nav className="todo-app__nav">
        <button
          className={`todo-app__nav-tab ${currentView === 'board' ? 'todo-app__nav-tab--active' : ''}`}
          onClick={() => setView('board')}
        >
          <EuiIcon type="visMapRegion" />
          Board
          <EuiText size="xs" color="subdued">[1]</EuiText>
        </button>
        <button
          className={`todo-app__nav-tab ${currentView === 'table' ? 'todo-app__nav-tab--active' : ''}`}
          onClick={() => setView('table')}
        >
          <EuiIcon type="visTable" />
          All Work
          <EuiText size="xs" color="subdued">[2]</EuiText>
        </button>
        <button
          className={`todo-app__nav-tab ${currentView === 'archived' ? 'todo-app__nav-tab--active' : ''}`}
          onClick={() => setView('archived')}
        >
          <EuiIcon type="folderClosed" />
          Archived
          <EuiText size="xs" color="subdued">[3]</EuiText>
          {archivedCount > 0 && (
            <span className="todo-app__nav-badge">
              {formatBadgeCount(archivedCount)}
            </span>
          )}
        </button>
        <button
          className={`todo-app__nav-tab ${currentView === 'stats' ? 'todo-app__nav-tab--active' : ''}`}
          onClick={() => setView('stats')}
        >
          <EuiIcon type="visBarVerticalStacked" />
          Stats
          <EuiText size="xs" color="subdued">[4]</EuiText>
        </button>
        <EuiPopover
          button={
            <EuiToolTip content="Keyboard shortcuts">
              <EuiButtonIcon
                iconType="keyboardShortcut"
                aria-label="Keyboard shortcuts"
                onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
              />
            </EuiToolTip>
          }
          isOpen={isShortcutsOpen}
          closePopover={() => setIsShortcutsOpen(false)}
          anchorPosition="downRight"
        >
          <div style={{ width: 280 }}>
            <EuiText size="s">
              <h4>Keyboard Shortcuts</h4>
            </EuiText>
            <EuiSpacer size="s" />
            {KEYBOARD_SHORTCUTS_HELP.map((group) => (
              <div key={group.category}>
                <EuiText size="xs" color="subdued">
                  <strong>{group.category}</strong>
                </EuiText>
                {group.shortcuts.map((s) => (
                  <EuiFlexGroup
                    key={s.keys}
                    justifyContent="spaceBetween"
                    alignItems="center"
                    gutterSize="s"
                  >
                    <EuiFlexItem>
                      <EuiText size="xs">{s.description}</EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <code>{s.keys}</code>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                ))}
                <EuiSpacer size="xs" />
              </div>
            ))}
            <EuiSpacer size="m" />
            <EuiLink
              onClick={() => {
                tourActions.resetTour();
                setIsShortcutsOpen(false);
              }}
            >
              <EuiIcon type="training" size="s" /> Restart app tour
            </EuiLink>
          </div>
        </EuiPopover>
      </nav>
      </EuiTourStep>

      {/* Content */}
      <main className="todo-app__content">
        {/* Toolbar - only for board and table views */}
        {currentView !== 'archived' && currentView !== 'stats' && (
          <div className="todo-toolbar">
            <EuiTourStep
              {...tourSteps.step4}
              footerAction={
                <EuiButton size="s" color="primary" onClick={() => tourActions.goToStep(5)}>
                  Next
                </EuiButton>
              }
            >
            <div className="todo-toolbar__search">
              <EuiFieldSearch
                id={SEARCH_INPUT_ID}
                placeholder="Search work... [/]"
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
                isClearable
                fullWidth
              />
            </div>
            </EuiTourStep>

            {/* Status filters - only for Kanban board view (Table has its own filters) */}
            {currentView === 'board' && (
              <div className="todo-toolbar__filters">
                <EuiFilterGroup>
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <EuiFilterButton
                      key={status}
                      hasActiveFilters={filters.status.includes(status as TodoStatus)}
                      onClick={() => toggleStatusFilter(status as TodoStatus)}
                      numFilters={statusCounts[status as TodoStatus] || 0}
                    >
                      {label}
                    </EuiFilterButton>
                  ))}
                </EuiFilterGroup>
              </div>
            )}

            <div className="todo-toolbar__actions">
              <EuiSuperSelect
                options={PRIORITY_OPTIONS}
                valueOfSelected={priorityFilter}
                onChange={(value) => setPriorityFilter(value)}
              />
              <EuiTourStep
                {...tourSteps.step2}
                footerAction={
                  <EuiButton size="s" color="primary" onClick={() => tourActions.goToStep(3)}>
                    Next
                  </EuiButton>
                }
              >
              <EuiButton
                fill
                iconType="plus"
                onClick={openCreateModal}
              >
                Create
              </EuiButton>
              </EuiTourStep>
            </div>
          </div>
        )}

        {/* View Content */}
        {((currentView === 'board' && kanbanLoading) || (currentView === 'table' && todosLoading)) ? (
          <EuiFlexGroup justifyContent="center" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <>
            {currentView === 'board' && (
              <EuiTourStep
                {...tourSteps.step5}
                footerAction={
                  <EuiButton size="s" color="primary" onClick={() => tourActions.finishTour()}>
                    Get Started!
                  </EuiButton>
                }
              >
              <KanbanBoard
                todosByStatus={todosByStatus}
                statusLabels={STATUS_LABELS}
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
            {currentView === 'table' && (
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
            {currentView === 'archived' && (
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
            {currentView === 'stats' && (
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
        <TodoModal
          onSave={handleSaveTodo}
          onClose={closeModal}
        />
      )}

      {/* Todo Detail Panel (Preview with inline edit) */}
      {detailPanelTodo && (
        <TodoDetailPanel
          todo={detailPanelTodo}
          onClose={closeDetailPanel}
          onUpdate={async (id, updates) => {
            await updateMutation.mutateAsync({ id, data: updates });
            // No toast for inline edits - visual feedback is sufficient
          }}
          onArchive={handleArchiveTodo}
          onDelete={handleDeleteTodo}
        />
      )}

    </div>
  );
};

// Main component with providers
export const TodoApp: React.FC<TodoAppProps> = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoAppContent {...props} />
    </QueryClientProvider>
  );
};

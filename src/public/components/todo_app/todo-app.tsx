import * as React from 'react';
import { useMemo } from 'react';
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
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS_HELP, SEARCH_INPUT_ID, useDebouncedSearch } from '../../hooks';
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

const TodoAppContent: React.FC<TodoAppProps> = ({
  notifications,
  http,
}) => {
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  
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
    getTodosByStatus,
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
    useStatistics,
    useCreateTodo, 
    useUpdateTodo, 
    useDeleteTodo, 
    useArchiveTodo, 
    useRestoreTodo, 
    useUpdateStatus,
    useBulkArchive,
    useBulkRestore,
    useBulkDelete,
  } = todoHooks;
  
  // Build search params with debounced query
  // Empty string or whitespace = undefined (load all without query filter)
  const searchQuery = debouncedQuery.trim() || undefined;
  
  const { data: todosData, isLoading: todosLoading } = useTodos({
    query: searchQuery,
    priority: priorityFilter !== 'all' ? [priorityFilter as TodoPriority] : undefined,
    assignee: filters.assignee || undefined,
  });
  
  const { data: archivedData } = useArchivedTodos();
  const { data: statisticsData, isLoading: statsLoading } = useStatistics();
  
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();
  const deleteMutation = useDeleteTodo();
  const archiveMutation = useArchiveTodo();
  const restoreMutation = useRestoreTodo();
  const updateStatusMutation = useUpdateStatus();
  const bulkArchiveMutation = useBulkArchive();
  const bulkRestoreMutation = useBulkRestore();
  const bulkDeleteMutation = useBulkDelete();

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

  // Get todos grouped by status, then apply client-side status filtering
  const allTodosByStatus = getTodosByStatus();
  
  // Apply client-side status filter if any status filters are selected
  const todosByStatus = useMemo(() => {
    // If no status filters selected, show all statuses
    if (filters.status.length === 0) {
      return allTodosByStatus;
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
      filtered[status] = allTodosByStatus[status] || [];
    });
    
    return filtered;
  }, [allTodosByStatus, filters.status]);

  // Get flat list of filtered todos for table view
  const filteredTodos = useMemo(() => {
    const todos = todosData?.items || [];
    if (filters.status.length === 0) {
      return todos;
    }
    return todos.filter((todo) => filters.status.includes(todo.status));
  }, [todosData?.items, filters.status]);

  const archivedTodosList = archivedData?.items || archivedTodos || [];

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
          {archivedTodosList.length > 0 && (
            <span className="todo-app__nav-badge">
              {archivedTodosList.length}
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

            <div className="todo-toolbar__filters">
              <EuiFilterGroup>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <EuiFilterButton
                    key={status}
                    hasActiveFilters={filters.status.includes(status as TodoStatus)}
                    onClick={() => toggleStatusFilter(status as TodoStatus)}
                    numFilters={allTodosByStatus[status as TodoStatus]?.length || 0}
                  >
                    {label}
                  </EuiFilterButton>
                ))}
              </EuiFilterGroup>
            </div>

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
        {todosLoading ? (
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
                  onStatusChange={handleStatusChange}
                  onArchiveTodo={handleArchiveTodo}
                  onDeleteTodo={handleDeleteTodo}
                  onCreateInStatus={openCreateModal}
                  isPending={isPending}
                />
              </EuiTourStep>
            )}
            {currentView === 'table' && (
              <TableView
                todos={filteredTodos}
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
                todos={archivedTodosList}
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
            notifications.toasts.addSuccess('Task updated');
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


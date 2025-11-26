import React, { useMemo } from 'react';
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
} from '@elastic/eui';
import { CoreStart } from '../../../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../../../src/plugins/navigation/public';
import { createTodoHooks, StoreActions } from '../../hooks';
import { useTodoStore } from '../../stores';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS_HELP, SEARCH_INPUT_ID, useDebouncedSearch } from '../../hooks';
import { TodoStatus, TodoPriority } from '../../../common/types';
import { KanbanBoard } from './kanban-board';
import { TableView } from './table-view';
import { ArchivedView } from './archived-view';
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
  }), [setTodos, setArchivedTodos, addTodo, updateTodoInStore, removeTodo, setLoading, closeModal]);

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
    useCreateTodo, 
    useUpdateTodo, 
    useDeleteTodo, 
    useArchiveTodo, 
    useRestoreTodo, 
    useUpdateStatus 
  } = todoHooks;
  
  // Build search params with debounced query
  // Empty string or whitespace = undefined (load all without query filter)
  const searchQuery = debouncedQuery.trim() || undefined;
  
  const { data: todosData, isLoading: todosLoading } = useTodos({
    query: searchQuery,
    status: filters.status.length > 0 ? filters.status : undefined,
    priority: priorityFilter !== 'all' ? [priorityFilter as TodoPriority] : undefined,
    assignee: filters.assignee || undefined,
  });
  
  const { data: archivedData } = useArchivedTodos();
  
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();
  const deleteMutation = useDeleteTodo();
  const archiveMutation = useArchiveTodo();
  const restoreMutation = useRestoreTodo();
  const updateStatusMutation = useUpdateStatus();

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

  const todosByStatus = getTodosByStatus();
  const archivedTodosList = archivedData?.items || archivedTodos || [];

  return (
    <div className="todo-app">
      {/* Header */}
      <header className="todo-app__header">
        <h1>
          <EuiIcon type="listAdd" size="l" />
          Security TODO Manager
        </h1>
        <EuiPopover
          button={
            <EuiToolTip content="Keyboard shortcuts">
              <EuiButtonIcon
                iconType="keyboard"
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
          </div>
        </EuiPopover>
      </header>

      {/* Navigation Tabs */}
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
      </nav>

      {/* Content */}
      <main className="todo-app__content">
        {/* Toolbar - only for board and table views */}
        {currentView !== 'archived' && (
          <div className="todo-toolbar">
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

            <div className="todo-toolbar__filters">
              <EuiFilterGroup>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <EuiFilterButton
                    key={status}
                    hasActiveFilters={filters.status.includes(status as TodoStatus)}
                    onClick={() => toggleStatusFilter(status as TodoStatus)}
                    numFilters={todosByStatus[status as TodoStatus]?.length || 0}
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
              <EuiButton
                fill
                iconType="plus"
                onClick={openCreateModal}
              >
                Create
              </EuiButton>
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
              <KanbanBoard
                todosByStatus={todosByStatus}
                statusLabels={STATUS_LABELS}
                onEditTodo={openDetailPanel}
                onStatusChange={handleStatusChange}
                onArchiveTodo={handleArchiveTodo}
                onCreateInStatus={openCreateModal}
              />
            )}
            {currentView === 'table' && (
              <TableView
                todos={todosData?.items || []}
                onEditTodo={openDetailPanel}
                onDeleteTodo={handleDeleteTodo}
                onArchiveTodo={handleArchiveTodo}
                onStatusChange={handleStatusChange}
              />
            )}
            {currentView === 'archived' && (
              <ArchivedView
                todos={archivedTodosList}
                onRestoreTodo={handleRestoreTodo}
                onDeleteTodo={handleDeleteTodo}
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


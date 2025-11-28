import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiBadge,
  EuiSuperSelect,
  EuiText,
  EuiCheckbox,
  EuiButton,
  EuiSpacer,
  EuiConfirmModal,
  EuiFlexGroup,
  EuiFlexItem,
  EuiEmptyPrompt,
  EuiFilterGroup,
  EuiFilterButton,
  Criteria,
  Pagination,
} from '@elastic/eui';
import { TodoItem, TodoStatus } from '../../../common/types';
import { formatDate } from '../../utils';
import { PriorityCell, AssigneeCell, WorkCell } from './shared';

interface TableViewProps {
  todos: TodoItem[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  isLoading?: boolean;
  onPaginationChange: (page: number, size: number) => void;
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onEditTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onArchiveTodo: (id: string) => void;
  onStatusChange: (id: string, status: TodoStatus) => void;
  onBulkArchive?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  isPending?: (id: string) => boolean;
}

const STATUS_OPTIONS = [
  { value: TodoStatus.PLANNED, inputDisplay: <EuiBadge color="default">To Do</EuiBadge> },
  { value: TodoStatus.IN_PROGRESS, inputDisplay: <EuiBadge color="primary">In Progress</EuiBadge> },
  { value: TodoStatus.BLOCKED, inputDisplay: <EuiBadge color="warning">Blocked</EuiBadge> },
  { value: TodoStatus.COMPLETED_SUCCESS, inputDisplay: <EuiBadge color="success">Done</EuiBadge> },
  { value: TodoStatus.COMPLETED_ERROR, inputDisplay: <EuiBadge color="danger">Error</EuiBadge> },
];

const STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: 'To Do',
  [TodoStatus.IN_PROGRESS]: 'In Progress',
  [TodoStatus.BLOCKED]: 'Blocked',
  [TodoStatus.COMPLETED_SUCCESS]: 'Done',
  [TodoStatus.COMPLETED_ERROR]: 'Error',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const TableView: React.FC<TableViewProps> = ({
  todos,
  totalItems,
  pageIndex,
  pageSize,
  sortField,
  sortDirection,
  isLoading = false,
  onPaginationChange,
  onSortChange,
  onEditTodo,
  onDeleteTodo,
  onArchiveTodo,
  onStatusChange,
  onBulkArchive,
  onBulkDelete,
  isPending = () => false,
}) => {
  const [selectedItems, setSelectedItems] = useState<TodoItem[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusFilters, setStatusFilters] = useState<TodoStatus[]>([]);

  // Toggle status filter
  const toggleStatusFilter = (status: TodoStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Count items by status (from loaded data)
  const statusCounts = useMemo(() => {
    const counts: Record<TodoStatus, number> = {
      [TodoStatus.PLANNED]: 0,
      [TodoStatus.IN_PROGRESS]: 0,
      [TodoStatus.BLOCKED]: 0,
      [TodoStatus.COMPLETED_SUCCESS]: 0,
      [TodoStatus.COMPLETED_ERROR]: 0,
    };
    todos.forEach((todo) => {
      if (counts[todo.status] !== undefined) {
        counts[todo.status]++;
      }
    });
    return counts;
  }, [todos]);

  // Filter items client-side based on selected status filters
  const filteredTodos = useMemo(() => {
    if (statusFilters.length === 0) {
      return todos;
    }
    return todos.filter((todo) => statusFilters.includes(todo.status));
  }, [todos, statusFilters]);

  // Clear selection when todos change
  React.useEffect(() => {
    setSelectedItems((prev) => prev.filter((item) => filteredTodos.some((t) => t.id === item.id)));
  }, [filteredTodos]);

  const handleBulkArchive = () => {
    if (onBulkArchive && selectedItems.length > 0) {
      onBulkArchive(selectedItems.map((item) => item.id));
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedItems.length > 0) {
      onBulkDelete(selectedItems.map((item) => item.id));
      setSelectedItems([]);
      setShowDeleteConfirm(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredTodos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredTodos]);
    }
  };

  const columns: EuiBasicTableColumn<TodoItem>[] = [
    {
      field: 'id',
      name: 'Work',
      width: '350px',
      render: (id: string, todo: TodoItem) => (
        <WorkCell
          todo={todo}
          isSelected={selectedItems.some((item) => item.id === id)}
          isPending={isPending(id)}
          onSelect={() => {
            setSelectedItems((prev) =>
              prev.some((item) => item.id === id)
                ? prev.filter((item) => item.id !== id)
                : [...prev, todo]
            );
          }}
          onEdit={() => onEditTodo(todo)}
          icon="document"
          checkboxIdPrefix="checkbox"
        />
      ),
    },
    {
      field: 'priority',
      name: 'Priority',
      width: '100px',
      sortable: true,
      render: (priority) => <PriorityCell priority={priority} />,
    },
    {
      field: 'status',
      name: 'Status',
      width: '150px',
      sortable: true,
      render: (status: TodoStatus, todo: TodoItem) => (
        <EuiSuperSelect
          options={STATUS_OPTIONS}
          valueOfSelected={status}
          onChange={(value) => onStatusChange(todo.id, value as TodoStatus)}
          compressed
        />
      ),
    },
    {
      field: 'updatedAt',
      name: 'Updated',
      width: '180px',
      sortable: true,
      render: (date: string) => (
        <EuiText size="s" color="subdued">
          {formatDate(date)}
        </EuiText>
      ),
    },
    {
      field: 'storyPoints',
      name: 'Story Points',
      width: '100px',
      sortable: true,
      align: 'center',
      render: (points?: number) => (
        points !== undefined && points > 0 ? (
          <EuiBadge color="hollow">{points}</EuiBadge>
        ) : (
          <EuiText size="s" color="subdued">-</EuiText>
        )
      ),
    },
    {
      field: 'assignee',
      name: 'Assignee',
      width: '150px',
      render: (assignee?: string) => <AssigneeCell assignee={assignee} />,
    },
    {
      name: 'Actions',
      width: '80px',
      actions: [
        {
          name: 'Edit',
          description: 'Edit this item',
          icon: 'pencil',
          type: 'icon',
          onClick: onEditTodo,
        },
        {
          name: 'Archive',
          description: 'Archive this item',
          icon: 'folderClosed',
          type: 'icon',
          onClick: (todo) => onArchiveTodo(todo.id),
        },
        {
          name: 'Delete',
          description: 'Delete this item',
          icon: 'trash',
          type: 'icon',
          color: 'danger',
          onClick: (todo) => onDeleteTodo(todo.id),
        },
      ],
    },
  ];

  const handleTableChange = (criteria: Criteria<TodoItem>) => {
    const { page: paginationChange, sort: sortChange } = criteria;
    
    // Handle pagination changes
    if (paginationChange) {
      const { index: newPageIndex, size: newPageSize } = paginationChange;
      onPaginationChange(newPageIndex, newPageSize);
    }
    
    // Handle sort changes (only if actually different)
    if (sortChange) {
      const newSortField = String(sortChange.field);
      const newSortDirection = sortChange.direction;
      const sortHasChanged = newSortField !== sortField || newSortDirection !== sortDirection;
      
      if (sortHasChanged) {
        onSortChange(newSortField, newSortDirection);
      }
    }
  };

  const pagination: Pagination = {
    pageIndex,
    pageSize,
    totalItemCount: totalItems,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };

  return (
    <>
      <div className="todo-table">
        {/* Status Filter Group - Client-side filtering */}
        <EuiFlexGroup alignItems="center" gutterSize="m" wrap className="todo-table__filters">
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <EuiFilterButton
                  key={status}
                  hasActiveFilters={statusFilters.includes(status as TodoStatus)}
                  onClick={() => toggleStatusFilter(status as TodoStatus)}
                  numFilters={statusCounts[status as TodoStatus] || 0}
                  numActiveFilters={
                    statusFilters.includes(status as TodoStatus)
                      ? statusCounts[status as TodoStatus]
                      : undefined
                  }
                >
                  {label}
                </EuiFilterButton>
              ))}
            </EuiFilterGroup>
          </EuiFlexItem>
          {statusFilters.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                iconType="cross"
                onClick={() => setStatusFilters([])}
                color="text"
              >
                Clear filters
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="m" />

        {filteredTodos.length > 0 && (
          <>
            <EuiFlexGroup alignItems="center" gutterSize="m" className="todo-table__bulk-actions">
              <EuiFlexItem grow={false}>
                <EuiCheckbox
                  id="select-all-checkbox"
                  checked={selectedItems.length === filteredTodos.length && filteredTodos.length > 0}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < filteredTodos.length}
                  onChange={handleSelectAll}
                  label={selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all on page'}
                />
              </EuiFlexItem>
              {selectedItems.length > 0 && (
                <>
                  <EuiFlexItem grow={false}>
                    <EuiButton size="s" iconType="folderClosed" onClick={handleBulkArchive}>
                      Archive ({selectedItems.length})
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton size="s" iconType="trash" color="danger" onClick={() => setShowDeleteConfirm(true)}>
                      Delete ({selectedItems.length})
                    </EuiButton>
                  </EuiFlexItem>
                </>
              )}
            </EuiFlexGroup>
            <EuiSpacer size="s" />
          </>
        )}

        <EuiBasicTable
          items={filteredTodos}
          columns={columns}
          rowHeader="title"
          sorting={{
            sort: {
              field: sortField as keyof TodoItem,
              direction: sortDirection,
            },
          }}
          pagination={pagination}
          onChange={handleTableChange}
          tableLayout="fixed"
          loading={isLoading}
          noItemsMessage={
            <EuiEmptyPrompt
              iconType="documents"
              iconColor="subdued"
              title={<h3>No work items yet</h3>}
              body={<p>Create your first TODO item to get started with tracking your security compliance tasks.</p>}
              titleSize="s"
            />
          }
        />
      </div>

      {showDeleteConfirm && (
        <EuiConfirmModal
          title={`Delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          buttonColor="danger"
        >
          <p>This action cannot be undone. {selectedItems.length > 1 ? 'These items' : 'This item'} will be permanently deleted.</p>
        </EuiConfirmModal>
      )}
    </>
  );
};

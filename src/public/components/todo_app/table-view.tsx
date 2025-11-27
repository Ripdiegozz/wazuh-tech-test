import * as React from 'react';
import { useState } from 'react';
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
} from '@elastic/eui';
import { TodoItem, TodoStatus } from '../../../common/types';
import { formatDate } from '../../utils';
import { PriorityCell, AssigneeCell, WorkCell } from './shared';

interface TableViewProps {
  todos: TodoItem[];
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

export const TableView: React.FC<TableViewProps> = ({
  todos,
  onEditTodo,
  onDeleteTodo,
  onArchiveTodo,
  onStatusChange,
  onBulkArchive,
  onBulkDelete,
  isPending = () => false,
}) => {
  const [selectedItems, setSelectedItems] = useState<TodoItem[]>([]);
  const [sortField, setSortField] = useState<keyof TodoItem>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Clear selection when todos change (e.g., after bulk operation)
  React.useEffect(() => {
    setSelectedItems((prev) => prev.filter((item) => todos.some((t) => t.id === item.id)));
  }, [todos]);

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
    if (selectedItems.length === todos.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...todos]);
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

  const onTableChange = ({ sort }: any) => {
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
  };

  const sortedTodos = React.useMemo(() => {
    return [...todos].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [todos, sortField, sortDirection]);

  return (
    <>
      <div className="todo-table">
        {/* Bulk Actions Bar */}
        {todos.length > 0 && (
          <>
            <EuiFlexGroup alignItems="center" gutterSize="m" className="todo-table__bulk-actions">
              <EuiFlexItem grow={false}>
                <EuiCheckbox
                  id="select-all-checkbox"
                  checked={selectedItems.length === todos.length && todos.length > 0}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < todos.length}
                  onChange={handleSelectAll}
                  label={selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
                />
              </EuiFlexItem>
              {selectedItems.length > 0 && (
                <>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      size="s"
                      iconType="folderClosed"
                      onClick={handleBulkArchive}
                    >
                      Archive ({selectedItems.length})
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      size="s"
                      iconType="trash"
                      color="danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
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
          items={sortedTodos}
          columns={columns}
          rowHeader="title"
          sorting={{
            sort: {
              field: sortField,
              direction: sortDirection,
            },
          }}
          onChange={onTableChange}
          tableLayout="fixed"
          noItemsMessage={
            <EuiEmptyPrompt
              iconType="documents"
              iconColor="subdued"
              title={<h3>No work items yet</h3>}
              body={
                <p>
                  Create your first TODO item to get started with tracking your security compliance tasks.
                </p>
              }
              titleSize="s"
            />
          }
        />
        
        <div className="todo-table__footer">
          {todos.length} of {todos.length} items
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <EuiConfirmModal
          title={`Delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          buttonColor="danger"
        >
          <p>
            This action cannot be undone. {selectedItems.length > 1 ? 'These items' : 'This item'} will be permanently deleted.
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};


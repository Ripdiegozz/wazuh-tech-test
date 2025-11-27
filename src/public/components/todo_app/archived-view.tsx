import * as React from 'react';
import { useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiEmptyPrompt,
  EuiConfirmModal,
  EuiButton,
  EuiCheckbox,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { TodoItem, TodoStatus } from '../../../common/types';
import { formatDate } from '../../utils';
import { PriorityCell, AssigneeCell, WorkCell } from './shared';

interface ArchivedViewProps {
  todos: TodoItem[];
  onRestoreTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  isPending?: (id: string) => boolean;
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: 'To Do',
  [TodoStatus.IN_PROGRESS]: 'In Progress',
  [TodoStatus.BLOCKED]: 'Blocked',
  [TodoStatus.COMPLETED_SUCCESS]: 'Done',
  [TodoStatus.COMPLETED_ERROR]: 'Error',
};

const STATUS_COLORS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: 'default',
  [TodoStatus.IN_PROGRESS]: 'primary',
  [TodoStatus.BLOCKED]: 'warning',
  [TodoStatus.COMPLETED_SUCCESS]: 'success',
  [TodoStatus.COMPLETED_ERROR]: 'danger',
};

export const ArchivedView: React.FC<ArchivedViewProps> = ({
  todos,
  onRestoreTodo,
  onDeleteTodo,
  onBulkRestore,
  onBulkDelete,
  isPending = () => false,
}) => {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<TodoItem[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Clear selection when todos change (e.g., after bulk operation)
  React.useEffect(() => {
    setSelectedItems((prev) => prev.filter((item) => todos.some((t) => t.id === item.id)));
  }, [todos]);

  const handleBulkRestore = () => {
    if (onBulkRestore && selectedItems.length > 0) {
      onBulkRestore(selectedItems.map((item) => item.id));
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedItems.length > 0) {
      onBulkDelete(selectedItems.map((item) => item.id));
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
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
          icon="folderClosed"
          checkboxIdPrefix="archived-checkbox"
        />
      ),
    },
    {
      field: 'priority',
      name: 'Priority',
      width: '100px',
      render: (priority) => <PriorityCell priority={priority} />,
    },
    {
      field: 'status',
      name: 'Status',
      width: '150px',
      render: (status: TodoStatus) => (
        <EuiBadge color={STATUS_COLORS[status]}>
          {STATUS_LABELS[status]}
        </EuiBadge>
      ),
    },
    {
      field: 'archivedAt',
      name: 'Archived',
      width: '180px',
      render: (date?: string) => (
        <EuiText size="s" color="subdued">
          {formatDate(date)}
        </EuiText>
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
      width: '200px',
      render: (todo: TodoItem) => {
        const pending = isPending(todo.id);
        return (
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                iconType={pending ? 'empty' : 'refresh'}
                onClick={() => onRestoreTodo(todo.id)}
                isLoading={pending}
                isDisabled={pending}
              >
                Restore
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                iconType="trash"
                color="danger"
                onClick={() => setItemToDelete(todo.id)}
                isDisabled={pending}
              >
                Delete
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      },
    },
  ];

  if (todos.length === 0) {
    return (
      <div className="archived-view__empty">
        <EuiEmptyPrompt
          iconType="folderClosed"
          iconColor="subdued"
          title={<h2>There are no archived work items</h2>}
          body={
            <p>Any archived work items in your space will appear here.</p>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="todo-table archived-view__container">
        <div className="todo-table__header">
          <h3>Archived work items</h3>
        </div>

        {/* Bulk Actions Bar */}
        <EuiFlexGroup alignItems="center" gutterSize="m" className="todo-table__bulk-actions">
          <EuiFlexItem grow={false}>
            <EuiCheckbox
              id="archived-select-all-checkbox"
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
                  iconType="refresh"
                  onClick={handleBulkRestore}
                >
                  Restore ({selectedItems.length})
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  iconType="trash"
                  color="danger"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  Delete ({selectedItems.length})
                </EuiButton>
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="s" />

        <EuiBasicTable
          items={todos}
          columns={columns}
          rowHeader="title"
          tableLayout="fixed"
        />
        
        <div className="todo-table__footer">
          {todos.length} archived item{todos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Single Item Delete Confirmation */}
      {itemToDelete && (
        <EuiConfirmModal
          title="Delete archived item?"
          onCancel={() => setItemToDelete(null)}
          onConfirm={() => {
            onDeleteTodo(itemToDelete);
            setItemToDelete(null);
          }}
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          buttonColor="danger"
        >
          <p>
            This action cannot be undone. The work item will be permanently deleted.
          </p>
        </EuiConfirmModal>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <EuiConfirmModal
          title={`Delete ${selectedItems.length} archived item${selectedItems.length > 1 ? 's' : ''}?`}
          onCancel={() => setShowBulkDeleteConfirm(false)}
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


import * as React from 'react';
import { useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiIcon,
  EuiBadge,
  EuiButtonEmpty,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiEmptyPrompt,
  EuiConfirmModal,
} from '@elastic/eui';
import { TodoItem, TodoStatus, TodoPriority } from '../../../common/types';

interface ArchivedViewProps {
  todos: TodoItem[];
  onRestoreTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
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

const PRIORITY_CONFIG: Record<TodoPriority, { icon: string; label: string; className: string }> = {
  [TodoPriority.LOW]: { icon: 'arrowDown', label: 'Low', className: 'priority-indicator--low' },
  [TodoPriority.MEDIUM]: { icon: 'minus', label: 'Medium', className: 'priority-indicator--medium' },
  [TodoPriority.HIGH]: { icon: 'arrowUp', label: 'High', className: 'priority-indicator--high' },
  [TodoPriority.CRITICAL]: { icon: 'bolt', label: 'Critical', className: 'priority-indicator--critical' },
};

export const ArchivedView: React.FC<ArchivedViewProps> = ({
  todos,
  onRestoreTodo,
  onDeleteTodo,
}) => {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const formatId = (id: string): string => {
    return `TODO-${id.slice(0, 4).toUpperCase()}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAssigneeInitials = (assignee?: string): string => {
    if (!assignee) return '?';
    return assignee
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns: EuiBasicTableColumn<TodoItem>[] = [
    {
      field: 'id',
      name: 'Work',
      width: '350px',
      render: (id: string, todo: TodoItem) => (
        <div className="todo-table__work-cell">
          <EuiIcon type="folderClosed" color="subdued" />
          <span>
            <span className="todo-table__work-id">{formatId(id)}</span>
            <span className="todo-table__work-title">{todo.title}</span>
          </span>
        </div>
      ),
    },
    {
      field: 'priority',
      name: 'Priority',
      width: '100px',
      render: (priority: TodoPriority) => {
        const config = PRIORITY_CONFIG[priority];
        return (
          <EuiToolTip content={config.label}>
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
              <EuiFlexItem grow={false}>
                <span className={`priority-indicator ${config.className}`}>
                  <EuiIcon type={config.icon} />
                </span>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s" color="subdued">
                  {config.label}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiToolTip>
        );
      },
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
      render: (assignee?: string) => (
        assignee ? (
          <div className="todo-table__assignee">
            <div className="todo-table__assignee-avatar">
              {getAssigneeInitials(assignee)}
            </div>
            <EuiText size="s" color="subdued">{assignee}</EuiText>
          </div>
        ) : (
          <EuiText size="s" color="subdued">Unassigned</EuiText>
        )
      ),
    },
    {
      name: 'Actions',
      width: '200px',
      render: (todo: TodoItem) => (
        <EuiFlexGroup gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="refresh"
              onClick={() => onRestoreTodo(todo.id)}
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
            >
              Delete
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
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
    </>
  );
};


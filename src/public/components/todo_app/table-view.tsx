import React, { useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiIcon,
  EuiBadge,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSuperSelect,
  EuiText,
  EuiCheckbox,
} from '@elastic/eui';
import { TodoItem, TodoStatus, TodoPriority } from '../../../common/types';

interface TableViewProps {
  todos: TodoItem[];
  onEditTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onArchiveTodo: (id: string) => void;
  onStatusChange: (id: string, status: TodoStatus) => void;
}

const STATUS_OPTIONS = [
  { value: TodoStatus.PLANNED, inputDisplay: <EuiBadge color="default">To Do</EuiBadge> },
  { value: TodoStatus.IN_PROGRESS, inputDisplay: <EuiBadge color="primary">In Progress</EuiBadge> },
  { value: TodoStatus.BLOCKED, inputDisplay: <EuiBadge color="warning">Blocked</EuiBadge> },
  { value: TodoStatus.COMPLETED_SUCCESS, inputDisplay: <EuiBadge color="success">Done</EuiBadge> },
  { value: TodoStatus.COMPLETED_ERROR, inputDisplay: <EuiBadge color="danger">Error</EuiBadge> },
];

const PRIORITY_CONFIG: Record<TodoPriority, { icon: string; label: string; className: string }> = {
  [TodoPriority.LOW]: { icon: 'arrowDown', label: 'Low', className: 'priority-indicator--low' },
  [TodoPriority.MEDIUM]: { icon: 'minus', label: 'Medium', className: 'priority-indicator--medium' },
  [TodoPriority.HIGH]: { icon: 'arrowUp', label: 'High', className: 'priority-indicator--high' },
  [TodoPriority.CRITICAL]: { icon: 'bolt', label: 'Critical', className: 'priority-indicator--critical' },
};

export const TableView: React.FC<TableViewProps> = ({
  todos,
  onEditTodo,
  onDeleteTodo,
  onArchiveTodo,
  onStatusChange,
}) => {
  const [selectedItems, setSelectedItems] = useState<TodoItem[]>([]);
  const [sortField, setSortField] = useState<keyof TodoItem>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatId = (id: string): string => {
    return `TODO-${id.slice(0, 4).toUpperCase()}`;
  };

  const formatDate = (dateString: string): string => {
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
          <EuiCheckbox
            id={`checkbox-${id}`}
            checked={selectedItems.some((item) => item.id === id)}
            onChange={() => {
              setSelectedItems((prev) =>
                prev.some((item) => item.id === id)
                  ? prev.filter((item) => item.id !== id)
                  : [...prev, todo]
              );
            }}
          />
          <EuiIcon type="document" color="subdued" />
          <EuiLink onClick={() => onEditTodo(todo)}>
            <span className="todo-table__work-id">{formatId(id)}</span>
            <span className="todo-table__work-title">{todo.title}</span>
          </EuiLink>
        </div>
      ),
    },
    {
      field: 'priority',
      name: 'Priority',
      width: '100px',
      sortable: true,
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
      render: (assignee?: string) => (
        assignee ? (
          <div className="todo-table__assignee">
            <div className="todo-table__assignee-avatar">
              {getAssigneeInitials(assignee)}
            </div>
            <EuiText size="s">{assignee}</EuiText>
          </div>
        ) : (
          <EuiText size="s" color="subdued">Unassigned</EuiText>
        )
      ),
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
    <div className="todo-table">
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
          <div className="empty-state">
            <EuiIcon type="document" size="xxl" className="empty-state__icon" />
            <div className="empty-state__title">No work items found</div>
            <div className="empty-state__description">
              Create your first TODO item to get started with tracking your security compliance tasks.
            </div>
          </div>
        }
      />
      
      <div className="todo-table__footer">
        {todos.length} of {todos.length} items
      </div>
    </div>
  );
};


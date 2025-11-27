import * as React from 'react';
import {
  EuiIcon,
  EuiToolTip,
  EuiContextMenu,
  EuiPopover,
  EuiButtonIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { TodoItem, TodoPriority } from '../../../common/types';

interface TodoCardProps {
  todo: TodoItem;
  onEdit: () => void;
  onArchive: () => void;
  isPending?: boolean;
}

const PRIORITY_CONFIG: Record<TodoPriority, { icon: string; className: string }> = {
  [TodoPriority.LOW]: { icon: 'arrowDown', className: 'priority-indicator--low' },
  [TodoPriority.MEDIUM]: { icon: 'minus', className: 'priority-indicator--medium' },
  [TodoPriority.HIGH]: { icon: 'arrowUp', className: 'priority-indicator--high' },
  [TodoPriority.CRITICAL]: { icon: 'bolt', className: 'priority-indicator--critical' },
};

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onEdit,
  onArchive,
  isPending = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const getAssigneeInitials = (assignee?: string): string => {
    if (!assignee) return '?';
    return assignee
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatId = (id: string): string => {
    return `TODO-${id.slice(0, 4).toUpperCase()}`;
  };

  const priorityConfig = PRIORITY_CONFIG[todo.priority];

  const menuPanels = [
    {
      id: 0,
      items: [
        {
          name: 'Edit',
          icon: 'pencil',
          onClick: () => {
            setIsPopoverOpen(false);
            onEdit();
          },
        },
        {
          name: 'Archive',
          icon: 'folderClosed',
          onClick: () => {
            setIsPopoverOpen(false);
            onArchive();
          },
        },
      ],
    },
  ];

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger edit if clicking on popover button
    if ((e.target as HTMLElement).closest('.euiButtonIcon')) {
      return;
    }
    onEdit();
  };

  return (
    <div className={`todo-card ${isPending ? 'todo-card--pending' : ''}`} onClick={handleCardClick}>
      {isPending && (
        <div className="todo-card__loading">
          <EuiLoadingSpinner size="s" />
        </div>
      )}
      {todo.coverImage && (
        <img
          className="todo-card__cover"
          src={todo.coverImage}
          alt=""
        />
      )}

      <div className="todo-card__title">{todo.title}</div>

      {todo.tags && todo.tags.length > 0 && (
        <div className="todo-card__tags">
          {todo.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="todo-card__tag">
              {tag}
            </span>
          ))}
          {todo.tags.length > 3 && (
            <span className="todo-card__tag todo-card__tag--overflow">
              +{todo.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="todo-card__meta">
        <span className="todo-card__id">{formatId(todo.id)}</span>

        <div className="todo-card__footer">
          <EuiToolTip content={`Priority: ${todo.priority}`}>
            <span className={`priority-indicator ${priorityConfig.className}`}>
              <EuiIcon type={priorityConfig.icon} size="s" />
            </span>
          </EuiToolTip>

          {todo.storyPoints !== undefined && todo.storyPoints > 0 && (
            <span className="todo-card__story-points">
              {todo.storyPoints}
            </span>
          )}

          {todo.assignee && (
            <EuiToolTip content={todo.assignee}>
              <div className="todo-card__assignee">
                {getAssigneeInitials(todo.assignee)}
              </div>
            </EuiToolTip>
          )}

          <EuiPopover
            button={
              <EuiButtonIcon
                iconType="boxesHorizontal"
                aria-label="More actions"
                size="s"
                color="text"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsPopoverOpen(!isPopoverOpen);
                }}
              />
            }
            isOpen={isPopoverOpen}
            closePopover={() => setIsPopoverOpen(false)}
            panelPaddingSize="none"
            anchorPosition="downRight"
          >
            <EuiContextMenu initialPanelId={0} panels={menuPanels} />
          </EuiPopover>
        </div>
      </div>
    </div>
  );
};


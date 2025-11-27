import * as React from 'react';
import {
  EuiIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  DropResult,
} from '@elastic/eui';
import { TodoItem, TodoStatus } from '../../../common/types';
import { TodoCard } from './todo-card';

interface KanbanBoardProps {
  todosByStatus: Record<TodoStatus, TodoItem[]>;
  statusLabels: Record<TodoStatus, string>;
  onEditTodo: (todo: TodoItem) => void;
  onStatusChange: (id: string, status: TodoStatus) => void;
  onArchiveTodo: (id: string) => void;
  onCreateInStatus: () => void;
  isPending?: (id: string) => boolean;
}

const COLUMN_ORDER: TodoStatus[] = [
  TodoStatus.PLANNED,
  TodoStatus.IN_PROGRESS,
  TodoStatus.BLOCKED,
  TodoStatus.COMPLETED_SUCCESS,
  TodoStatus.COMPLETED_ERROR,
];

const COLUMN_ICONS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: 'clock',
  [TodoStatus.IN_PROGRESS]: 'play',
  [TodoStatus.BLOCKED]: 'crossInACircleFilled',
  [TodoStatus.COMPLETED_SUCCESS]: 'checkInCircleFilled',
  [TodoStatus.COMPLETED_ERROR]: 'alert',
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  todosByStatus,
  statusLabels,
  onEditTodo,
  onStatusChange,
  onArchiveTodo,
  onCreateInStatus,
  isPending = () => false,
}) => {
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) {
      return;
    }

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Get the new status from destination droppableId
    const newStatus = destination.droppableId as TodoStatus;
    const todoId = draggableId;

    // Only update if status changed
    if (source.droppableId !== destination.droppableId) {
      onStatusChange(todoId, newStatus);
    }
  };

  return (
    <EuiDragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {COLUMN_ORDER.map((status) => (
          <div
            key={status}
            className={`kanban-column kanban-column--${status}`}
          >
            {/* Column Header */}
            <div className="kanban-column__header">
              <h3>
                <EuiIcon type={COLUMN_ICONS[status]} size="s" />
                {statusLabels[status]}
              </h3>
              <span className="kanban-column__count">
                {todosByStatus[status]?.length || 0}
              </span>
            </div>

            {/* Droppable Area */}
            <EuiDroppable
              droppableId={status}
              spacing="m"
              className="kanban-column__cards"
            >
              {todosByStatus[status]?.map((todo, index) => (
                <EuiDraggable
                  key={todo.id}
                  index={index}
                  draggableId={todo.id}
                  spacing="m"
                >
                  {(provided, state) => (
                    <div className={state.isDragging ? 'dragging' : ''}>
                      <TodoCard
                        todo={todo}
                        onEdit={() => onEditTodo(todo)}
                        onArchive={() => onArchiveTodo(todo.id)}
                        isPending={isPending(todo.id)}
                      />
                    </div>
                  )}
                </EuiDraggable>
              ))}
            </EuiDroppable>

            {/* Add Button - only in PLANNED column */}
            {status === TodoStatus.PLANNED && (
              <button
                className="kanban-column__add-btn"
                onClick={onCreateInStatus}
              >
                <EuiIcon type="plus" size="s" />
                Create issue
              </button>
            )}
          </div>
        ))}
      </div>
    </EuiDragDropContext>
  );
};


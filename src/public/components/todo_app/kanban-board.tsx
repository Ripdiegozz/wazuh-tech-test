import * as React from 'react';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  EuiIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiButtonEmpty,
  EuiText,
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
  onDeleteTodo: (id: string) => void;
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

// Number of items to show initially and load per batch
const INITIAL_ITEMS_PER_COLUMN = 15;
const ITEMS_PER_LOAD = 10;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  todosByStatus,
  statusLabels,
  onEditTodo,
  onStatusChange,
  onArchiveTodo,
  onDeleteTodo,
  onCreateInStatus,
  isPending = () => false,
}) => {
  // Track how many items to show per column
  const [visibleCounts, setVisibleCounts] = useState<Record<TodoStatus, number>>(() => {
    const initial: Record<string, number> = {};
    COLUMN_ORDER.forEach((status) => {
      initial[status] = INITIAL_ITEMS_PER_COLUMN;
    });
    return initial as Record<TodoStatus, number>;
  });

  // Refs for intersection observers
  const loadMoreRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset visible counts when data changes significantly
  useEffect(() => {
    // If a column has fewer items than visible count, adjust
    COLUMN_ORDER.forEach((status) => {
      const totalItems = todosByStatus[status]?.length || 0;
      if (totalItems < visibleCounts[status] && totalItems > 0) {
        setVisibleCounts((prev) => ({
          ...prev,
          [status]: Math.max(totalItems, INITIAL_ITEMS_PER_COLUMN),
        }));
      }
    });
  }, [todosByStatus]);

  // Load more items for a specific column
  const loadMore = useCallback((status: TodoStatus) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [status]: prev[status] + ITEMS_PER_LOAD,
    }));
  }, []);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    COLUMN_ORDER.forEach((status) => {
      const ref = loadMoreRefs.current[status];
      if (!ref) return;

      const totalItems = todosByStatus[status]?.length || 0;
      const visibleCount = visibleCounts[status];
      
      // Only observe if there are more items to load
      if (visibleCount >= totalItems) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore(status);
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [todosByStatus, visibleCounts, loadMore]);

  // Get visible items for each column
  const getVisibleItems = useCallback(
    (status: TodoStatus): TodoItem[] => {
      const items = todosByStatus[status] || [];
      return items.slice(0, visibleCounts[status]);
    },
    [todosByStatus, visibleCounts]
  );

  // Check if column has more items to load
  const hasMoreItems = useCallback(
    (status: TodoStatus): boolean => {
      const totalItems = todosByStatus[status]?.length || 0;
      return visibleCounts[status] < totalItems;
    },
    [todosByStatus, visibleCounts]
  );

  // Get remaining count
  const getRemainingCount = useCallback(
    (status: TodoStatus): number => {
      const totalItems = todosByStatus[status]?.length || 0;
      return Math.max(0, totalItems - visibleCounts[status]);
    },
    [todosByStatus, visibleCounts]
  );

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
        {COLUMN_ORDER.map((status) => {
          const visibleItems = getVisibleItems(status);
          const totalItems = todosByStatus[status]?.length || 0;
          const remaining = getRemainingCount(status);
          const showLoadMore = hasMoreItems(status);

          return (
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
                  {visibleItems.length !== totalItems
                    ? `${visibleItems.length}/${totalItems}`
                    : totalItems}
                </span>
              </div>

              {/* Droppable Area */}
              <EuiDroppable
                droppableId={status}
                spacing="m"
                className="kanban-column__cards"
              >
                {visibleItems.map((todo, index) => (
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
                          onDelete={() => onDeleteTodo(todo.id)}
                          isPending={isPending(todo.id)}
                        />
                      </div>
                    )}
                  </EuiDraggable>
                ))}
              </EuiDroppable>

              {/* Load More / Infinite Scroll Trigger */}
              {showLoadMore && (
                <div
                  ref={(el) => {
                    loadMoreRefs.current[status] = el;
                  }}
                  className="kanban-column__load-more"
                >
                  <EuiButtonEmpty
                    size="s"
                    iconType="arrowDown"
                    onClick={() => loadMore(status)}
                  >
                    Load {Math.min(remaining, ITEMS_PER_LOAD)} more
                  </EuiButtonEmpty>
                  <EuiText size="xs" color="subdued">
                    {remaining} hidden
                  </EuiText>
                </div>
              )}

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
          );
        })}
      </div>
    </EuiDragDropContext>
  );
};

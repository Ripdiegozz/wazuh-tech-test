import * as React from 'react';
import { useRef, useEffect } from 'react';
import {
  EuiIcon,
  EuiDragDropContext,
  EuiDraggable,
  EuiDroppable,
  EuiLoadingSpinner,
  EuiText,
  DropResult,
} from '@elastic/eui';
import { TodoItem, TodoStatus } from '../../../common/types';
import { TodoCard } from './todo-card';

interface KanbanBoardProps {
  todosByStatus: Record<TodoStatus, TodoItem[]>;
  statusLabels: Record<TodoStatus, string>;
  onEditTodo: (todo: TodoItem) => void;
  onReorder: (id: string, status: TodoStatus, position: number) => void;
  onArchiveTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onCreateInStatus: () => void;
  isPending?: (id: string) => boolean;
  // Infinite scroll props
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
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
  onReorder,
  onArchiveTodo,
  onDeleteTodo,
  onCreateInStatus,
  isPending = () => false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  totalCount = 0,
  loadedCount = 0,
}) => {
  // Ref for intersection observer sentinel
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { 
        threshold: 0,
        rootMargin: '500px' // Trigger 500px before reaching the sentinel
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  /**
   * Calculate the new position based on adjacent items
   * Uses decimal positioning like Trello (insert between existing positions)
   */
  const calculatePosition = (
    sourceStatus: TodoStatus,
    sourceIndex: number,
    destinationStatus: TodoStatus,
    destinationIndex: number,
    draggedItemId: string
  ): number => {
    const items = todosByStatus[destinationStatus] || [];
    
    // If moving within the same column, we need to filter out the dragged item
    // to get correct adjacent items
    const isSameColumn = sourceStatus === destinationStatus;
    const filteredItems = isSameColumn 
      ? items.filter((item) => item.id !== draggedItemId)
      : items;
    
    // Adjust destination index for same column moves
    // If moving down, the index stays the same after filtering
    // If moving up, it stays the same too because we filtered the item
    const adjustedIndex = isSameColumn && sourceIndex < destinationIndex
      ? destinationIndex - 1
      : destinationIndex;
    
    // If dropping at the beginning
    if (adjustedIndex === 0) {
      const firstItem = filteredItems[0];
      const firstPosition = firstItem?.position ?? 1000;
      return Math.max(1, firstPosition / 2); // Ensure position > 0
    }
    
    // If dropping at the end
    if (adjustedIndex >= filteredItems.length) {
      const lastItem = filteredItems[filteredItems.length - 1];
      const lastPosition = lastItem?.position ?? 0;
      return lastPosition + 1000;
    }
    
    // If dropping between two items
    const prevItem = filteredItems[adjustedIndex - 1];
    const nextItem = filteredItems[adjustedIndex];
    const prevPosition = prevItem?.position ?? 0;
    const nextPosition = nextItem?.position ?? prevPosition + 2000;
    
    return (prevPosition + nextPosition) / 2;
  };

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

    // Get the new status and calculate position
    const sourceStatus = source.droppableId as TodoStatus;
    const newStatus = destination.droppableId as TodoStatus;
    const todoId = draggableId;
    
    // Debug: Log items in destination column with their positions
    const destItems = todosByStatus[newStatus] || [];
    console.log('=== DRAG END ===');
    console.log('Dragged item ID:', todoId);
    console.log('Source:', sourceStatus, 'index:', source.index);
    console.log('Destination:', newStatus, 'index:', destination.index);
    console.log('Items in destination column:');
    destItems.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.title.slice(0, 20)}... - position: ${item.position ?? 'undefined'}`);
    });
    
    // Calculate the new position based on where it was dropped
    const newPosition = calculatePosition(
      sourceStatus,
      source.index,
      newStatus,
      destination.index,
      todoId
    );

    console.log('>>> Calculated new position:', newPosition);
    console.log('================');

    // Call reorder with the new status and position
    onReorder(todoId, newStatus, newPosition);
  };

  return (
    <EuiDragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {COLUMN_ORDER.map((status) => {
          const items = todosByStatus[status] || [];

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
                <span className="kanban-column__count">{items.length}</span>
              </div>

              {/* Droppable Area */}
              <EuiDroppable
                droppableId={status}
                spacing="m"
                className="kanban-column__cards"
              >
                {items.map((todo, index) => (
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

      {/* Infinite Scroll Sentinel & Loading Indicator */}
      <div ref={loadMoreRef} className="kanban-board__load-more">
        {isLoadingMore && (
          <div className="kanban-board__loading">
            <EuiLoadingSpinner size="m" />
            <EuiText size="s" color="subdued">Loading more...</EuiText>
          </div>
        )}
        {hasMore && !isLoadingMore && loadedCount < totalCount && (
          <EuiText size="xs" color="subdued" textAlign="center">
            Showing {loadedCount} of {totalCount} items
          </EuiText>
        )}
      </div>
    </EuiDragDropContext>
  );
};

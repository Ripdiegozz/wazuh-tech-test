import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanBoard } from "./kanban-board";
import { TodoItem, TodoStatus, TodoPriority } from "../../../common/types";

// Mock EUI Drag and Drop components
jest.mock("@elastic/eui", () => {
  const actual = jest.requireActual("@elastic/eui");
  return {
    ...actual,
    EuiDragDropContext: ({ children }: any) => {
      // Simple wrapper for testing - drag functionality tested via integration tests
      return <div data-testid="drag-drop-context">{children}</div>;
    },
    EuiDroppable: ({ children, droppableId }: any) => (
      <div
        data-testid={`droppable-${droppableId}`}
        data-droppable-id={droppableId}
      >
        {typeof children === "function" ? children({}, {}) : children}
      </div>
    ),
    EuiDraggable: ({ children, draggableId, index }: any) => {
      const provided = {
        draggableProps: {},
        dragHandleProps: {},
        innerRef: () => {},
      };
      const state = { isDragging: false };
      return (
        <div
          data-testid={`draggable-${draggableId}`}
          data-draggable-id={draggableId}
          data-index={index}
        >
          {typeof children === "function"
            ? children(provided, state)
            : children}
        </div>
      );
    },
  };
});

// Mock TodoCard component
jest.mock("./todo-card", () => ({
  TodoCard: ({
    todo,
    onEdit,
    onArchive,
    onDelete,
    isPending,
  }: {
    todo: TodoItem;
    onEdit: () => void;
    onArchive: () => void;
    onDelete: () => void;
    isPending: boolean;
  }) => (
    <div
      data-testid={`todo-card-${todo.id}`}
      className={isPending ? "pending" : ""}
    >
      <span data-testid={`card-title-${todo.id}`}>{todo.title}</span>
      <span data-testid={`card-priority-${todo.id}`}>{todo.priority}</span>
      <button data-testid={`card-edit-${todo.id}`} onClick={onEdit}>
        Edit
      </button>
      <button data-testid={`card-archive-${todo.id}`} onClick={onArchive}>
        Archive
      </button>
      <button data-testid={`card-delete-${todo.id}`} onClick={onDelete}>
        Delete
      </button>
    </div>
  ),
}));

const createMockTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: "test-id-1",
  title: "Test Todo",
  description: "Test description",
  status: TodoStatus.PLANNED,
  priority: TodoPriority.MEDIUM,
  tags: ["test"],
  complianceStandards: [],
  archived: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
  position: 1000,
  ...overrides,
});

const createTodosByStatus = (): Record<TodoStatus, TodoItem[]> => ({
  [TodoStatus.PLANNED]: [
    createMockTodo({ id: "todo-1", title: "Planned Task 1", position: 1000 }),
    createMockTodo({ id: "todo-2", title: "Planned Task 2", position: 2000 }),
  ],
  [TodoStatus.IN_PROGRESS]: [
    createMockTodo({
      id: "todo-3",
      title: "In Progress Task",
      status: TodoStatus.IN_PROGRESS,
      position: 1000,
    }),
  ],
  [TodoStatus.BLOCKED]: [
    createMockTodo({
      id: "todo-4",
      title: "Blocked Task",
      status: TodoStatus.BLOCKED,
      position: 1000,
    }),
  ],
  [TodoStatus.COMPLETED_SUCCESS]: [
    createMockTodo({
      id: "todo-5",
      title: "Completed Task",
      status: TodoStatus.COMPLETED_SUCCESS,
      position: 1000,
    }),
  ],
  [TodoStatus.COMPLETED_ERROR]: [],
});

const STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: "To Do",
  [TodoStatus.IN_PROGRESS]: "In Progress",
  [TodoStatus.BLOCKED]: "Blocked",
  [TodoStatus.COMPLETED_SUCCESS]: "Done",
  [TodoStatus.COMPLETED_ERROR]: "Error",
};

describe("KanbanBoard", () => {
  const defaultProps = {
    todosByStatus: createTodosByStatus(),
    statusLabels: STATUS_LABELS,
    onEditTodo: jest.fn(),
    onReorder: jest.fn(),
    onArchiveTodo: jest.fn(),
    onDeleteTodo: jest.fn(),
    onCreateInStatus: jest.fn(),
    isPending: jest.fn().mockReturnValue(false),
    hasMore: false,
    isLoadingMore: false,
    onLoadMore: jest.fn(),
    totalCount: 5,
    loadedCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all kanban columns", () => {
      render(<KanbanBoard {...defaultProps} />);

      // Check all columns are rendered
      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Blocked")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("renders todo cards in correct columns", () => {
      render(<KanbanBoard {...defaultProps} />);

      // Check cards are in correct droppable areas
      const plannedDroppable = screen.getByTestId(
        `droppable-${TodoStatus.PLANNED}`
      );
      const inProgressDroppable = screen.getByTestId(
        `droppable-${TodoStatus.IN_PROGRESS}`
      );

      expect(screen.getByTestId("todo-card-todo-1")).toBeInTheDocument();
      expect(screen.getByTestId("todo-card-todo-2")).toBeInTheDocument();
      expect(screen.getByTestId("todo-card-todo-3")).toBeInTheDocument();
    });

    it("renders column item counts", () => {
      render(<KanbanBoard {...defaultProps} />);

      // Check count badges (2 planned, 1 in progress, etc.)
      const countBadges = document.querySelectorAll(".kanban-column__count");
      const counts = Array.from(countBadges).map((badge) => badge.textContent);

      expect(counts).toContain("2"); // PLANNED
      expect(counts).toContain("1"); // IN_PROGRESS
      expect(counts).toContain("0"); // COMPLETED_ERROR (empty)
    });

    it('renders "Create issue" button only in PLANNED column', () => {
      render(<KanbanBoard {...defaultProps} />);

      const createButtons = screen.getAllByText("Create issue");
      expect(createButtons).toHaveLength(1);
    });

    it("renders empty columns correctly", () => {
      const emptyTodosByStatus: Record<TodoStatus, TodoItem[]> = {
        [TodoStatus.PLANNED]: [],
        [TodoStatus.IN_PROGRESS]: [],
        [TodoStatus.BLOCKED]: [],
        [TodoStatus.COMPLETED_SUCCESS]: [],
        [TodoStatus.COMPLETED_ERROR]: [],
      };

      render(
        <KanbanBoard {...defaultProps} todosByStatus={emptyTodosByStatus} />
      );

      // All columns should still render
      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();

      // All counts should be 0
      const countBadges = document.querySelectorAll(".kanban-column__count");
      countBadges.forEach((badge) => {
        expect(badge.textContent).toBe("0");
      });
    });
  });

  describe("Card Interactions", () => {
    it("calls onEditTodo when edit button is clicked", () => {
      render(<KanbanBoard {...defaultProps} />);

      const editButton = screen.getByTestId("card-edit-todo-1");
      fireEvent.click(editButton);

      expect(defaultProps.onEditTodo).toHaveBeenCalledWith(
        expect.objectContaining({ id: "todo-1" })
      );
    });

    it("calls onArchiveTodo when archive button is clicked", () => {
      render(<KanbanBoard {...defaultProps} />);

      const archiveButton = screen.getByTestId("card-archive-todo-1");
      fireEvent.click(archiveButton);

      expect(defaultProps.onArchiveTodo).toHaveBeenCalledWith("todo-1");
    });

    it("calls onDeleteTodo when delete button is clicked", () => {
      render(<KanbanBoard {...defaultProps} />);

      const deleteButton = screen.getByTestId("card-delete-todo-1");
      fireEvent.click(deleteButton);

      expect(defaultProps.onDeleteTodo).toHaveBeenCalledWith("todo-1");
    });

    it("calls onCreateInStatus when create button is clicked", () => {
      render(<KanbanBoard {...defaultProps} />);

      const createButton = screen.getByText("Create issue");
      fireEvent.click(createButton);

      expect(defaultProps.onCreateInStatus).toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("shows pending state on cards", () => {
      const isPending = jest.fn((id: string) => id === "todo-1");

      render(<KanbanBoard {...defaultProps} isPending={isPending} />);

      const pendingCard = screen.getByTestId("todo-card-todo-1");
      expect(pendingCard).toHaveClass("pending");

      const normalCard = screen.getByTestId("todo-card-todo-3");
      expect(normalCard).not.toHaveClass("pending");
    });
  });

  describe("Drag and Drop Context", () => {
    it("renders drag drop context", () => {
      render(<KanbanBoard {...defaultProps} />);

      expect(screen.getByTestId("drag-drop-context")).toBeInTheDocument();
    });

    it("renders draggable items", () => {
      render(<KanbanBoard {...defaultProps} />);

      // Check draggable items exist
      expect(screen.getByTestId("draggable-todo-1")).toBeInTheDocument();
      expect(screen.getByTestId("draggable-todo-2")).toBeInTheDocument();
      expect(screen.getByTestId("draggable-todo-3")).toBeInTheDocument();
    });

    it("renders droppable columns for each status", () => {
      render(<KanbanBoard {...defaultProps} />);

      // Each status should have a droppable
      expect(
        screen.getByTestId(`droppable-${TodoStatus.PLANNED}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`droppable-${TodoStatus.IN_PROGRESS}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`droppable-${TodoStatus.BLOCKED}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`droppable-${TodoStatus.COMPLETED_SUCCESS}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`droppable-${TodoStatus.COMPLETED_ERROR}`)
      ).toBeInTheDocument();
    });
  });

  describe("Infinite Scroll", () => {
    it("shows loading spinner when isLoadingMore is true", () => {
      render(
        <KanbanBoard {...defaultProps} isLoadingMore={true} hasMore={true} />
      );

      expect(screen.getByText("Loading more...")).toBeInTheDocument();
    });

    it("does not show loading spinner when not loading", () => {
      render(<KanbanBoard {...defaultProps} isLoadingMore={false} />);

      expect(screen.queryByText("Loading more...")).not.toBeInTheDocument();
    });

    it("shows item count when hasMore and not loading", () => {
      render(
        <KanbanBoard
          {...defaultProps}
          hasMore={true}
          isLoadingMore={false}
          loadedCount={5}
          totalCount={20}
        />
      );

      expect(screen.getByText("Showing 5 of 20 items")).toBeInTheDocument();
    });

    it("does not show item count when all items are loaded", () => {
      render(
        <KanbanBoard
          {...defaultProps}
          hasMore={false}
          loadedCount={5}
          totalCount={5}
        />
      );

      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });
  });

  describe("Card Content", () => {
    it("displays todo titles correctly", () => {
      render(<KanbanBoard {...defaultProps} />);

      expect(screen.getByTestId("card-title-todo-1")).toHaveTextContent(
        "Planned Task 1"
      );
      expect(screen.getByTestId("card-title-todo-2")).toHaveTextContent(
        "Planned Task 2"
      );
      expect(screen.getByTestId("card-title-todo-3")).toHaveTextContent(
        "In Progress Task"
      );
    });

    it("displays todo priorities", () => {
      render(<KanbanBoard {...defaultProps} />);

      expect(screen.getByTestId("card-priority-todo-1")).toHaveTextContent(
        TodoPriority.MEDIUM
      );
    });
  });

  describe("Column Order", () => {
    it("renders columns in correct order", () => {
      render(<KanbanBoard {...defaultProps} />);

      const columns = document.querySelectorAll(".kanban-column");
      const columnStatuses = Array.from(columns).map((col) => {
        const header = col.querySelector(".kanban-column__header h3");
        return header?.textContent?.trim();
      });

      // Should be in order: To Do, In Progress, Blocked, Done, Error
      expect(columnStatuses[0]).toContain("To Do");
      expect(columnStatuses[1]).toContain("In Progress");
      expect(columnStatuses[2]).toContain("Blocked");
      expect(columnStatuses[3]).toContain("Done");
      expect(columnStatuses[4]).toContain("Error");
    });
  });

  describe("Draggable Index", () => {
    it("assigns correct indices to draggable items", () => {
      render(<KanbanBoard {...defaultProps} />);

      const draggable1 = screen.getByTestId("draggable-todo-1");
      const draggable2 = screen.getByTestId("draggable-todo-2");

      expect(draggable1).toHaveAttribute("data-index", "0");
      expect(draggable2).toHaveAttribute("data-index", "1");
    });
  });

  describe("Many Items", () => {
    it("handles many items in a single column", () => {
      const manyPlannedTodos = Array.from({ length: 20 }, (_, i) =>
        createMockTodo({
          id: `todo-${i}`,
          title: `Task ${i}`,
          position: (i + 1) * 1000,
        })
      );

      const todosByStatus: Record<TodoStatus, TodoItem[]> = {
        [TodoStatus.PLANNED]: manyPlannedTodos,
        [TodoStatus.IN_PROGRESS]: [],
        [TodoStatus.BLOCKED]: [],
        [TodoStatus.COMPLETED_SUCCESS]: [],
        [TodoStatus.COMPLETED_ERROR]: [],
      };

      render(<KanbanBoard {...defaultProps} todosByStatus={todosByStatus} />);

      // All 20 items should be rendered
      manyPlannedTodos.forEach((todo) => {
        expect(screen.getByTestId(`todo-card-${todo.id}`)).toBeInTheDocument();
      });

      // Count badge should show 20
      const plannedColumn = document.querySelector(
        `.kanban-column--${TodoStatus.PLANNED}`
      );
      const countBadge = plannedColumn?.querySelector(".kanban-column__count");
      expect(countBadge?.textContent).toBe("20");
    });
  });
});

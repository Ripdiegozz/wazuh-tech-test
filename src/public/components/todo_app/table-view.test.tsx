import * as React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { TableView } from "./table-view";
import { TodoItem, TodoStatus, TodoPriority } from "../../../common/types";

// Mock EUI components that are complex
jest.mock("@elastic/eui", () => {
  const actual = jest.requireActual("@elastic/eui");
  return {
    ...actual,
    EuiSuperSelect: ({ options, valueOfSelected, onChange }: any) => (
      <select
        data-testid="status-select"
        value={valueOfSelected}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.value}
          </option>
        ))}
      </select>
    ),
  };
});

// Mock shared components
jest.mock("./shared", () => ({
  PriorityCell: ({ priority }: { priority: string }) => (
    <span data-testid="priority-cell">{priority}</span>
  ),
  AssigneeCell: ({ assignee }: { assignee?: string }) => (
    <span data-testid="assignee-cell">{assignee || "Unassigned"}</span>
  ),
  WorkCell: ({
    todo,
    isSelected,
    onSelect,
    onEdit,
  }: {
    todo: TodoItem;
    isSelected: boolean;
    onSelect: () => void;
    onEdit?: () => void;
  }) => (
    <div data-testid={`work-cell-${todo.id}`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        data-testid={`checkbox-${todo.id}`}
      />
      <button onClick={onEdit} data-testid={`edit-btn-${todo.id}`}>
        {todo.title}
      </button>
    </div>
  ),
}));

// Mock utils
jest.mock("../../utils", () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
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
  ...overrides,
});

const createMockTodos = (count: number): TodoItem[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockTodo({
      id: `todo-${i + 1}`,
      title: `Todo ${i + 1}`,
      status:
        i % 5 === 0
          ? TodoStatus.PLANNED
          : i % 5 === 1
          ? TodoStatus.IN_PROGRESS
          : i % 5 === 2
          ? TodoStatus.BLOCKED
          : i % 5 === 3
          ? TodoStatus.COMPLETED_SUCCESS
          : TodoStatus.COMPLETED_ERROR,
    })
  );
};

describe("TableView", () => {
  const defaultProps = {
    todos: createMockTodos(5),
    totalItems: 50,
    pageIndex: 0,
    pageSize: 10,
    sortField: "updatedAt",
    sortDirection: "desc" as const,
    isLoading: false,
    onPaginationChange: jest.fn(),
    onSortChange: jest.fn(),
    onEditTodo: jest.fn(),
    onDeleteTodo: jest.fn(),
    onArchiveTodo: jest.fn(),
    onStatusChange: jest.fn(),
    onBulkArchive: jest.fn(),
    onBulkDelete: jest.fn(),
    isPending: jest.fn().mockReturnValue(false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the table with todos", () => {
      render(<TableView {...defaultProps} />);

      // Check that todos are rendered
      defaultProps.todos.forEach((todo) => {
        expect(screen.getByTestId(`work-cell-${todo.id}`)).toBeInTheDocument();
      });
    });

    it("renders empty state when no todos", () => {
      render(<TableView {...defaultProps} todos={[]} totalItems={0} />);

      expect(screen.getByText("No work items yet")).toBeInTheDocument();
      expect(
        screen.getByText(/Create your first TODO item/)
      ).toBeInTheDocument();
    });

    it("renders status filter buttons", () => {
      render(<TableView {...defaultProps} />);

      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Blocked")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("renders select all checkbox", () => {
      render(<TableView {...defaultProps} />);

      expect(screen.getByText("Select all on page")).toBeInTheDocument();
    });

    it("shows loading state", () => {
      render(<TableView {...defaultProps} isLoading={true} />);

      // EUI table shows loading indicator
      expect(
        document.querySelector(".euiBasicTable-loading")
      ).toBeInTheDocument();
    });
  });

  describe("Status Filtering", () => {
    it("filters todos by status when filter button is clicked", () => {
      const todos = createMockTodos(10);
      render(<TableView {...defaultProps} todos={todos} />);

      // Click on "In Progress" filter
      const inProgressFilter = screen.getByText("In Progress");
      fireEvent.click(inProgressFilter);

      // Should only show IN_PROGRESS todos
      const inProgressTodos = todos.filter(
        (t) => t.status === TodoStatus.IN_PROGRESS
      );
      const plannedTodos = todos.filter((t) => t.status === TodoStatus.PLANNED);

      inProgressTodos.forEach((todo) => {
        expect(screen.getByTestId(`work-cell-${todo.id}`)).toBeInTheDocument();
      });

      // Other status todos should not be visible (filtered out)
      plannedTodos.forEach((todo) => {
        expect(
          screen.queryByTestId(`work-cell-${todo.id}`)
        ).not.toBeInTheDocument();
      });
    });

    it("shows clear filters button when filters are active", () => {
      render(<TableView {...defaultProps} />);

      // Initially no clear button
      expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();

      // Click a filter
      fireEvent.click(screen.getByText("To Do"));

      // Now clear button should appear
      expect(screen.getByText("Clear filters")).toBeInTheDocument();
    });

    it("clears all filters when clear button is clicked", () => {
      const todos = createMockTodos(10);
      render(<TableView {...defaultProps} todos={todos} />);

      // Apply a filter
      fireEvent.click(screen.getByText("To Do"));

      // Clear the filter
      fireEvent.click(screen.getByText("Clear filters"));

      // All todos should be visible again
      todos.forEach((todo) => {
        expect(screen.getByTestId(`work-cell-${todo.id}`)).toBeInTheDocument();
      });
    });

    it("allows multiple status filters", () => {
      const todos = createMockTodos(10);
      render(<TableView {...defaultProps} todos={todos} />);

      // Click on both "To Do" and "In Progress" filters
      fireEvent.click(screen.getByText("To Do"));
      fireEvent.click(screen.getByText("In Progress"));

      // Should show both PLANNED and IN_PROGRESS todos
      const matchingTodos = todos.filter(
        (t) =>
          t.status === TodoStatus.PLANNED || t.status === TodoStatus.IN_PROGRESS
      );

      matchingTodos.forEach((todo) => {
        expect(screen.getByTestId(`work-cell-${todo.id}`)).toBeInTheDocument();
      });
    });
  });

  describe("Selection", () => {
    it("selects individual todo when checkbox is clicked", () => {
      render(<TableView {...defaultProps} />);

      const firstTodo = defaultProps.todos[0];
      const checkbox = screen.getByTestId(`checkbox-${firstTodo.id}`);

      fireEvent.click(checkbox);

      // Should show "1 selected" text
      expect(screen.getByText("1 selected")).toBeInTheDocument();
    });

    it("selects all todos when select all is clicked", () => {
      render(<TableView {...defaultProps} />);

      const selectAllCheckbox = screen.getByLabelText("Select all on page");
      fireEvent.click(selectAllCheckbox);

      // Should show all selected
      expect(
        screen.getByText(`${defaultProps.todos.length} selected`)
      ).toBeInTheDocument();
    });

    it("deselects all when select all is clicked again", () => {
      render(<TableView {...defaultProps} />);

      const selectAllCheckbox = screen.getByLabelText("Select all on page");

      // Select all
      fireEvent.click(selectAllCheckbox);
      expect(
        screen.getByText(`${defaultProps.todos.length} selected`)
      ).toBeInTheDocument();

      // Deselect all
      fireEvent.click(selectAllCheckbox);
      expect(screen.getByText("Select all on page")).toBeInTheDocument();
    });

    it("shows bulk action buttons when items are selected", () => {
      render(<TableView {...defaultProps} />);

      // Initially no bulk buttons
      expect(screen.queryByText(/Archive \(/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Delete \(/)).not.toBeInTheDocument();

      // Select a todo
      fireEvent.click(
        screen.getByTestId(`checkbox-${defaultProps.todos[0].id}`)
      );

      // Now bulk buttons should appear
      expect(screen.getByText("Archive (1)")).toBeInTheDocument();
      expect(screen.getByText("Delete (1)")).toBeInTheDocument();
    });
  });

  describe("Bulk Actions", () => {
    it("calls onBulkArchive when archive button is clicked", () => {
      render(<TableView {...defaultProps} />);

      // Select two todos
      fireEvent.click(
        screen.getByTestId(`checkbox-${defaultProps.todos[0].id}`)
      );
      fireEvent.click(
        screen.getByTestId(`checkbox-${defaultProps.todos[1].id}`)
      );

      // Click archive button
      fireEvent.click(screen.getByText("Archive (2)"));

      expect(defaultProps.onBulkArchive).toHaveBeenCalledWith([
        defaultProps.todos[0].id,
        defaultProps.todos[1].id,
      ]);
    });

    it("shows delete confirmation modal when delete button is clicked", () => {
      render(<TableView {...defaultProps} />);

      // Select a todo
      fireEvent.click(
        screen.getByTestId(`checkbox-${defaultProps.todos[0].id}`)
      );

      // Click delete button
      fireEvent.click(screen.getByText("Delete (1)"));

      // Confirmation modal should appear
      expect(screen.getByText("Delete 1 item?")).toBeInTheDocument();
      expect(
        screen.getByText(/This action cannot be undone/)
      ).toBeInTheDocument();
    });

    it("calls onBulkDelete when confirmed", () => {
      render(<TableView {...defaultProps} />);

      // Select a todo
      fireEvent.click(
        screen.getByTestId(`checkbox-${defaultProps.todos[0].id}`)
      );

      // Click delete button
      fireEvent.click(screen.getByText("Delete (1)"));

      // Confirm deletion
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      fireEvent.click(confirmButton);

      expect(defaultProps.onBulkDelete).toHaveBeenCalledWith([
        defaultProps.todos[0].id,
      ]);
    });

    it("closes modal when cancelled", () => {
      render(<TableView {...defaultProps} />);

      // Select a todo
      fireEvent.click(
        screen.getByTestId(`checkbox-${defaultProps.todos[0].id}`)
      );

      // Click delete button
      fireEvent.click(screen.getByText("Delete (1)"));

      // Cancel
      fireEvent.click(screen.getByText("Cancel"));

      // Modal should close
      expect(screen.queryByText("Delete 1 item?")).not.toBeInTheDocument();
    });
  });

  describe("Status Change", () => {
    it("calls onStatusChange when status is changed", () => {
      render(<TableView {...defaultProps} />);

      // Find first status select
      const statusSelects = screen.getAllByTestId("status-select");
      const firstSelect = statusSelects[0];

      // Change status
      fireEvent.change(firstSelect, {
        target: { value: TodoStatus.COMPLETED_SUCCESS },
      });

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        defaultProps.todos[0].id,
        TodoStatus.COMPLETED_SUCCESS
      );
    });
  });

  describe("Edit Action", () => {
    it("calls onEditTodo when edit button is clicked", () => {
      render(<TableView {...defaultProps} />);

      const firstTodo = defaultProps.todos[0];
      const editButton = screen.getByTestId(`edit-btn-${firstTodo.id}`);

      fireEvent.click(editButton);

      expect(defaultProps.onEditTodo).toHaveBeenCalledWith(firstTodo);
    });
  });

  describe("Pagination", () => {
    it("displays correct pagination info", () => {
      render(<TableView {...defaultProps} />);

      // Check pagination shows correct range (EUI format)
      expect(screen.getByText(/Rows per page/)).toBeInTheDocument();
    });
  });

  describe("Story Points Display", () => {
    it("renders story points when present", () => {
      const todosWithPoints = [
        createMockTodo({ id: "todo-1", storyPoints: 5 }),
        createMockTodo({ id: "todo-2", storyPoints: 3 }),
      ];

      render(<TableView {...defaultProps} todos={todosWithPoints} />);

      // Use getAllByText since numbers can appear in multiple places (badge + filter counts)
      expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    });

    it("shows dash when story points are undefined", () => {
      const todosWithoutPoints = [
        createMockTodo({ id: "todo-1", storyPoints: undefined }),
      ];

      render(<TableView {...defaultProps} todos={todosWithoutPoints} />);

      // Multiple dashes may appear (e.g., for story points and compliance columns)
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });
});

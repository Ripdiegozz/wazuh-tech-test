import * as React from "react";
import { useState } from "react";
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
  Criteria,
  Pagination,
} from "@elastic/eui";
import { TodoItem, TodoStatus } from "../../../common/types";
import { formatDate } from "../../utils";
import { PriorityCell, AssigneeCell, WorkCell } from "./shared";

interface ArchivedViewProps {
  todos: TodoItem[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  isLoading?: boolean;
  onPaginationChange: (page: number, size: number) => void;
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  onRestoreTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  isPending?: (id: string) => boolean;
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: "To Do",
  [TodoStatus.IN_PROGRESS]: "In Progress",
  [TodoStatus.BLOCKED]: "Blocked",
  [TodoStatus.COMPLETED_SUCCESS]: "Done",
  [TodoStatus.COMPLETED_ERROR]: "Error",
};

const STATUS_COLORS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: "default",
  [TodoStatus.IN_PROGRESS]: "primary",
  [TodoStatus.BLOCKED]: "warning",
  [TodoStatus.COMPLETED_SUCCESS]: "success",
  [TodoStatus.COMPLETED_ERROR]: "danger",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const ArchivedView: React.FC<ArchivedViewProps> = ({
  todos,
  totalItems,
  pageIndex,
  pageSize,
  sortField,
  sortDirection,
  isLoading = false,
  onPaginationChange,
  onSortChange,
  onRestoreTodo,
  onDeleteTodo,
  onBulkRestore,
  onBulkDelete,
  isPending = () => false,
}) => {
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<TodoItem[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Clear selection when todos change
  React.useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((item) => todos.some((t) => t.id === item.id))
    );
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

  const handleTableChange = (criteria: Criteria<TodoItem>) => {
    const { page: paginationChange, sort: sortChange } = criteria;

    // Handle pagination changes
    if (paginationChange) {
      const { index: newPageIndex, size: newPageSize } = paginationChange;
      onPaginationChange(newPageIndex, newPageSize);
    }

    // Handle sort changes (only if actually different)
    if (sortChange) {
      const newSortField = String(sortChange.field);
      const newSortDirection = sortChange.direction;
      const sortHasChanged =
        newSortField !== sortField || newSortDirection !== sortDirection;

      if (sortHasChanged) {
        onSortChange(newSortField, newSortDirection);
      }
    }
  };

  const columns: EuiBasicTableColumn<TodoItem>[] = [
    {
      field: "id",
      name: "Work",
      width: "350px",
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
      field: "priority",
      name: "Priority",
      width: "100px",
      sortable: true,
      render: (priority) => <PriorityCell priority={priority} />,
    },
    {
      field: "status",
      name: "Status",
      width: "150px",
      sortable: true,
      render: (status: TodoStatus) => (
        <EuiBadge color={STATUS_COLORS[status]}>
          {STATUS_LABELS[status]}
        </EuiBadge>
      ),
    },
    {
      field: "archivedAt",
      name: "Archived",
      width: "180px",
      sortable: true,
      render: (date?: string) => (
        <EuiText size="s" color="subdued">
          {formatDate(date)}
        </EuiText>
      ),
    },
    {
      field: "assignee",
      name: "Assignee",
      width: "150px",
      render: (assignee?: string) => <AssigneeCell assignee={assignee} />,
    },
    {
      name: "Actions",
      width: "200px",
      render: (todo: TodoItem) => {
        const pending = isPending(todo.id);
        return (
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                iconType={pending ? "empty" : "refresh"}
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

  const pagination: Pagination = {
    pageIndex,
    pageSize,
    totalItemCount: totalItems,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };

  if (totalItems === 0 && !isLoading) {
    return (
      <div className="archived-view__empty">
        <EuiEmptyPrompt
          iconType="folderClosed"
          iconColor="subdued"
          title={<h2>No archived items</h2>}
          body={
            <p>
              When you archive work items, they'll appear here. Archived items
              are hidden from the main views but can be restored anytime.
            </p>
          }
          titleSize="m"
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

        <EuiFlexGroup
          alignItems="center"
          gutterSize="m"
          className="todo-table__bulk-actions"
        >
          <EuiFlexItem grow={false}>
            <EuiCheckbox
              id="archived-select-all-checkbox"
              checked={
                selectedItems.length === todos.length && todos.length > 0
              }
              indeterminate={
                selectedItems.length > 0 && selectedItems.length < todos.length
              }
              onChange={handleSelectAll}
              label={
                selectedItems.length > 0
                  ? `${selectedItems.length} selected`
                  : "Select all on page"
              }
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
          loading={isLoading}
          responsive={false}
          hasActions={true}
          sorting={{
            sort: {
              field: sortField as keyof TodoItem,
              direction: sortDirection,
            },
          }}
          pagination={pagination}
          onChange={handleTableChange}
        />
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
            This action cannot be undone. The work item will be permanently
            deleted.
          </p>
        </EuiConfirmModal>
      )}

      {showBulkDeleteConfirm && (
        <EuiConfirmModal
          title={`Delete ${selectedItems.length} archived item${
            selectedItems.length > 1 ? "s" : ""
          }?`}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          buttonColor="danger"
        >
          <p>
            This action cannot be undone.{" "}
            {selectedItems.length > 1 ? "These items" : "This item"} will be
            permanently deleted.
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};

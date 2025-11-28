import * as React from "react";
import {
  EuiIcon,
  EuiToolTip,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiLink,
  EuiCheckbox,
  EuiLoadingSpinner,
} from "@elastic/eui";
import { TodoItem, TodoPriority } from "../../../../common/types";
import { PRIORITY_CONFIG } from "../../../constants";
import { formatId, getAssigneeInitials } from "../../../utils";

interface PriorityCellProps {
  priority: TodoPriority;
}

export const PriorityCell: React.FC<PriorityCellProps> = ({ priority }) => {
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
};

interface AssigneeCellProps {
  assignee?: string;
}

export const AssigneeCell: React.FC<AssigneeCellProps> = ({ assignee }) => {
  if (!assignee) {
    return (
      <EuiText size="s" color="subdued">
        Unassigned
      </EuiText>
    );
  }

  return (
    <div className="todo-table__assignee">
      <div className="todo-table__assignee-avatar">
        {getAssigneeInitials(assignee)}
      </div>
      <EuiText size="s">{assignee}</EuiText>
    </div>
  );
};

interface WorkCellProps {
  todo: TodoItem;
  isSelected: boolean;
  isPending: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  icon?: string;
  checkboxIdPrefix?: string;
}

export const WorkCell: React.FC<WorkCellProps> = ({
  todo,
  isSelected,
  isPending,
  onSelect,
  onEdit,
  icon = "document",
  checkboxIdPrefix = "checkbox",
}) => {
  const content = (
    <>
      <span className="todo-table__work-id">{formatId(todo.id)}</span>
      <span className="todo-table__work-title">{todo.title}</span>
    </>
  );

  return (
    <div
      className={`todo-table__work-cell ${
        isPending ? "todo-table__work-cell--pending" : ""
      }`}
    >
      {isPending ? (
        <EuiLoadingSpinner size="s" />
      ) : (
        <EuiCheckbox
          id={`${checkboxIdPrefix}-${todo.id}`}
          checked={isSelected}
          onChange={onSelect}
        />
      )}
      <EuiIcon type={icon} color="subdued" />
      {onEdit ? (
        <EuiLink onClick={onEdit}>{content}</EuiLink>
      ) : (
        <span>{content}</span>
      )}
    </div>
  );
};

interface DateCellProps {
  date?: string;
  formatter: (date?: string) => string;
}

export const DateCell: React.FC<DateCellProps> = ({ date, formatter }) => {
  return (
    <EuiText size="s" color="subdued">
      {formatter(date)}
    </EuiText>
  );
};

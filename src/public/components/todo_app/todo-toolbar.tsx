import * as React from "react";
import {
  EuiFieldSearch,
  EuiButton,
  EuiFilterGroup,
  EuiFilterButton,
  EuiFilterSelectItem,
  EuiSuperSelect,
  EuiPopover,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiBadge,
  EuiTourStep,
} from "@elastic/eui";
import { SEARCH_INPUT_ID } from "../../hooks";
import {
  STATUS_LABELS,
  PRIORITY_OPTIONS,
  COMPLIANCE_LABELS,
} from "./shared/constants";
import { TodoStatus, ComplianceStandard } from "../../../common/types";

interface TodoToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Status filters (for Kanban)
  showStatusFilters: boolean;
  statusFilters: TodoStatus[];
  onToggleStatusFilter: (status: TodoStatus) => void;
  statusCounts: Record<TodoStatus, number>;
  // Compliance filters (for Kanban)
  complianceFilters: ComplianceStandard[];
  onToggleComplianceFilter: (standard: ComplianceStandard) => void;
  complianceCounts: Record<ComplianceStandard, number>;
  // Priority filter
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  // Actions
  onCreateClick: () => void;
  // Tour steps
  tourSteps: {
    step2: any;
    step4: any;
  };
  tourActions: {
    goToStep: (step: number) => void;
  };
}

export const TodoToolbar: React.FC<TodoToolbarProps> = ({
  searchQuery,
  onSearchChange,
  showStatusFilters,
  statusFilters,
  onToggleStatusFilter,
  statusCounts,
  complianceFilters,
  onToggleComplianceFilter,
  complianceCounts,
  priorityFilter,
  onPriorityChange,
  onCreateClick,
  tourSteps,
  tourActions,
}) => {
  const [isCompliancePopoverOpen, setIsCompliancePopoverOpen] =
    React.useState(false);

  return (
    <div className="todo-toolbar">
      <EuiTourStep
        {...tourSteps.step4}
        footerAction={
          <EuiButton
            size="s"
            color="primary"
            onClick={() => tourActions.goToStep(5)}
          >
            Next
          </EuiButton>
        }
      >
        <div className="todo-toolbar__search">
          <EuiFieldSearch
            id={SEARCH_INPUT_ID}
            placeholder="Search work... [/]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            isClearable
            fullWidth
          />
        </div>
      </EuiTourStep>

      {/* Status filters - only for Kanban board view */}
      {showStatusFilters && (
        <div className="todo-toolbar__filters">
          <EuiFilterGroup>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <EuiFilterButton
                key={status}
                hasActiveFilters={statusFilters.includes(status as TodoStatus)}
                onClick={() => onToggleStatusFilter(status as TodoStatus)}
                numFilters={statusCounts[status as TodoStatus] || 0}
              >
                {label}
              </EuiFilterButton>
            ))}
          </EuiFilterGroup>

          {/* Compliance Standards Multi-Select Filter */}
          <EuiFilterGroup>
            <EuiPopover
              id="kanbanComplianceFilterPopover"
              button={
                <EuiFilterButton
                  iconType="arrowDown"
                  onClick={() =>
                    setIsCompliancePopoverOpen(!isCompliancePopoverOpen)
                  }
                  isSelected={isCompliancePopoverOpen}
                  hasActiveFilters={complianceFilters.length > 0}
                  numActiveFilters={
                    complianceFilters.length > 0
                      ? complianceFilters.length
                      : undefined
                  }
                >
                  Compliance
                </EuiFilterButton>
              }
              isOpen={isCompliancePopoverOpen}
              closePopover={() => setIsCompliancePopoverOpen(false)}
              panelPaddingSize="none"
              anchorPosition="downLeft"
            >
              <div style={{ width: 200 }}>
                {Object.entries(COMPLIANCE_LABELS).map(([standard, label]) => (
                  <EuiFilterSelectItem
                    key={standard}
                    checked={
                      complianceFilters.includes(standard as ComplianceStandard)
                        ? "on"
                        : undefined
                    }
                    onClick={() =>
                      onToggleComplianceFilter(standard as ComplianceStandard)
                    }
                  >
                    <EuiFlexGroup
                      alignItems="center"
                      gutterSize="s"
                      responsive={false}
                    >
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="securityApp" size="s" />
                      </EuiFlexItem>
                      <EuiFlexItem>{label}</EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiBadge color="hollow">
                          {complianceCounts[standard as ComplianceStandard] ||
                            0}
                        </EuiBadge>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFilterSelectItem>
                ))}
              </div>
            </EuiPopover>
          </EuiFilterGroup>
        </div>
      )}

      <div className="todo-toolbar__actions">
        <EuiSuperSelect
          options={PRIORITY_OPTIONS}
          valueOfSelected={priorityFilter}
          onChange={(value) => onPriorityChange(value)}
        />
        <EuiTourStep
          {...tourSteps.step2}
          footerAction={
            <EuiButton
              size="s"
              color="primary"
              onClick={() => tourActions.goToStep(3)}
            >
              Next
            </EuiButton>
          }
        >
          <EuiButton fill iconType="plus" onClick={onCreateClick}>
            Create
          </EuiButton>
        </EuiTourStep>
      </div>
    </div>
  );
};


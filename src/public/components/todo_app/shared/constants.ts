import {
  TodoStatus,
  TodoPriority,
  ComplianceStandard,
} from "../../../../common/types";

export const STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.PLANNED]: "To Do",
  [TodoStatus.IN_PROGRESS]: "In Progress",
  [TodoStatus.BLOCKED]: "Blocked",
  [TodoStatus.COMPLETED_SUCCESS]: "Done",
  [TodoStatus.COMPLETED_ERROR]: "Error",
};

export const PRIORITY_OPTIONS = [
  { value: "all", inputDisplay: "All Priorities" },
  { value: TodoPriority.LOW, inputDisplay: "Low" },
  { value: TodoPriority.MEDIUM, inputDisplay: "Medium" },
  { value: TodoPriority.HIGH, inputDisplay: "High" },
  { value: TodoPriority.CRITICAL, inputDisplay: "Critical" },
];

export const COMPLIANCE_LABELS: Record<ComplianceStandard, string> = {
  [ComplianceStandard.PCI_DSS]: "PCI DSS",
  [ComplianceStandard.ISO_27001]: "ISO 27001",
  [ComplianceStandard.SOX]: "SOX",
  [ComplianceStandard.HIPAA]: "HIPAA",
  [ComplianceStandard.GDPR]: "GDPR",
  [ComplianceStandard.NIST]: "NIST",
};

export const formatBadgeCount = (count: number): string => {
  return count > 99 ? "99+" : String(count);
};


import * as React from "react";
import { EuiBadge } from "@elastic/eui";
import {
  TodoStatus,
  TodoPriority,
  ComplianceStandard,
} from "../../common/types";

export const STATUS_OPTIONS = [
  {
    value: TodoStatus.PLANNED,
    inputDisplay: React.createElement(EuiBadge, { color: "default" }, "To Do"),
  },
  {
    value: TodoStatus.IN_PROGRESS,
    inputDisplay: React.createElement(
      EuiBadge,
      { color: "primary" },
      "In Progress"
    ),
  },
  {
    value: TodoStatus.BLOCKED,
    inputDisplay: React.createElement(EuiBadge, { color: "danger" }, "Blocked"),
  },
  {
    value: TodoStatus.COMPLETED_SUCCESS,
    inputDisplay: React.createElement(EuiBadge, { color: "success" }, "Done"),
  },
  {
    value: TodoStatus.COMPLETED_ERROR,
    inputDisplay: React.createElement(EuiBadge, { color: "warning" }, "Error"),
  },
];

export const PRIORITY_OPTIONS = [
  {
    value: TodoPriority.LOW,
    inputDisplay: React.createElement(EuiBadge, { color: "hollow" }, "Low"),
  },
  {
    value: TodoPriority.MEDIUM,
    inputDisplay: React.createElement(EuiBadge, { color: "primary" }, "Medium"),
  },
  {
    value: TodoPriority.HIGH,
    inputDisplay: React.createElement(EuiBadge, { color: "warning" }, "High"),
  },
  {
    value: TodoPriority.CRITICAL,
    inputDisplay: React.createElement(
      EuiBadge,
      { color: "danger" },
      "Critical"
    ),
  },
];

export const PRIORITY_CONFIG: Record<
  TodoPriority,
  { icon: string; label: string; className: string }
> = {
  [TodoPriority.LOW]: {
    icon: "arrowDown",
    label: "Low",
    className: "priority-indicator--low",
  },
  [TodoPriority.MEDIUM]: {
    icon: "minus",
    label: "Medium",
    className: "priority-indicator--medium",
  },
  [TodoPriority.HIGH]: {
    icon: "arrowUp",
    label: "High",
    className: "priority-indicator--high",
  },
  [TodoPriority.CRITICAL]: {
    icon: "bolt",
    label: "Critical",
    className: "priority-indicator--critical",
  },
};

export const COMPLIANCE_OPTIONS = [
  { label: "PCI DSS", value: ComplianceStandard.PCI_DSS },
  { label: "ISO 27001", value: ComplianceStandard.ISO_27001 },
  { label: "SOX", value: ComplianceStandard.SOX },
  { label: "HIPAA", value: ComplianceStandard.HIPAA },
  { label: "GDPR", value: ComplianceStandard.GDPR },
  { label: "NIST", value: ComplianceStandard.NIST },
];

export const SUGGESTED_TAGS = [
  { label: "security" },
  { label: "compliance" },
  { label: "audit" },
  { label: "vulnerability" },
  { label: "patch" },
  { label: "review" },
  { label: "incident" },
  { label: "monitoring" },
  { label: "access-control" },
  { label: "encryption" },
];

export const SUGGESTED_TAG_LABELS = SUGGESTED_TAGS.map((t) => t.label);

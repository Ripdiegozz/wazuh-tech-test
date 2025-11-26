import React from 'react';
import { EuiBadge } from '@elastic/eui';
import { TodoStatus, TodoPriority, ComplianceStandard } from '../../common/types';

// Status Options
export const STATUS_OPTIONS = [
  { value: TodoStatus.PLANNED, inputDisplay: React.createElement(EuiBadge, { color: '#6B7280' }, 'To Do') },
  { value: TodoStatus.IN_PROGRESS, inputDisplay: React.createElement(EuiBadge, { color: '#3B82F6' }, 'In Progress') },
  { value: TodoStatus.BLOCKED, inputDisplay: React.createElement(EuiBadge, { color: '#EF4444' }, 'Blocked') },
  { value: TodoStatus.COMPLETED_SUCCESS, inputDisplay: React.createElement(EuiBadge, { color: '#10B981' }, 'Done') },
  { value: TodoStatus.COMPLETED_ERROR, inputDisplay: React.createElement(EuiBadge, { color: '#F59E0B' }, 'Error') },
];

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: TodoPriority.LOW, inputDisplay: React.createElement(EuiBadge, { color: 'hollow' }, 'Low') },
  { value: TodoPriority.MEDIUM, inputDisplay: React.createElement(EuiBadge, { color: 'primary' }, 'Medium') },
  { value: TodoPriority.HIGH, inputDisplay: React.createElement(EuiBadge, { color: 'warning' }, 'High') },
  { value: TodoPriority.CRITICAL, inputDisplay: React.createElement(EuiBadge, { color: 'danger' }, 'Critical') },
];

// Compliance Options
export const COMPLIANCE_OPTIONS = [
  { label: 'PCI DSS', value: ComplianceStandard.PCI_DSS },
  { label: 'ISO 27001', value: ComplianceStandard.ISO_27001 },
  { label: 'SOX', value: ComplianceStandard.SOX },
  { label: 'HIPAA', value: ComplianceStandard.HIPAA },
  { label: 'GDPR', value: ComplianceStandard.GDPR },
  { label: 'NIST', value: ComplianceStandard.NIST },
];

// Suggested Tags
export const SUGGESTED_TAGS = [
  { label: 'security' },
  { label: 'compliance' },
  { label: 'audit' },
  { label: 'vulnerability' },
  { label: 'patch' },
  { label: 'review' },
  { label: 'incident' },
  { label: 'monitoring' },
  { label: 'access-control' },
  { label: 'encryption' },
];

export const SUGGESTED_TAG_LABELS = SUGGESTED_TAGS.map(t => t.label);

/**
 * TODO item status enum
 */
export enum TodoStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED_SUCCESS = 'completed_success',
  COMPLETED_ERROR = 'completed_error',
  BLOCKED = 'blocked',
}

/**
 * Priority levels for TODO items
 */
export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security compliance standards
 */
export enum ComplianceStandard {
  PCI_DSS = 'pci_dss',
  ISO_27001 = 'iso_27001',
  SOX = 'sox',
  HIPAA = 'hipaa',
  GDPR = 'gdpr',
  NIST = 'nist',
}

/**
 * Core TODO entity interface
 */
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  tags: string[];
  complianceStandards: ComplianceStandard[];
  assignee?: string;
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
  plannedDate?: string;           // ISO 8601 date
  completedAt?: string;           // ISO 8601 timestamp
  dueDate?: string;               // ISO 8601 date
  errorDetails?: string;          // Error message if status is COMPLETED_ERROR
  archived: boolean;              // Whether the item is archived
  archivedAt?: string;            // ISO 8601 timestamp when archived
  storyPoints?: number;           // Story points for estimation
  coverImage?: string;            // URL or base64 for cover image
  position?: number;              // Position within status column (for Kanban ordering)
}

/**
 * Request to create a new TODO item
 */
export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority: TodoPriority;
  tags?: string[];
  complianceStandards?: ComplianceStandard[];
  assignee?: string;
  plannedDate?: string;
  dueDate?: string;
  status?: TodoStatus;
  storyPoints?: number;
  coverImage?: string;
}

/**
 * Request to update an existing TODO item
 */
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  tags?: string[];
  complianceStandards?: ComplianceStandard[];
  assignee?: string;
  plannedDate?: string;
  dueDate?: string;
  completedAt?: string;
  errorDetails?: string;
  archived?: boolean;
  archivedAt?: string;
  storyPoints?: number;
  coverImage?: string;
  position?: number;
}

/**
 * Search/filter parameters
 */
export interface TodoSearchParams {
  query?: string;                 // Full-text search
  status?: TodoStatus[];          // Filter by status
  priority?: TodoPriority[];      // Filter by priority
  tags?: string[];                // Filter by tags
  complianceStandards?: ComplianceStandard[];
  assignee?: string;
  dateFrom?: string;              // Created after
  dateTo?: string;                // Created before
  sortField?: string;             // Field to sort by
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
  archived?: boolean;             // Filter by archived status
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/**
 * Statistics for dashboard visualizations
 */
export interface TodoStatistics {
  totalCount: number;
  byStatus: Record<TodoStatus, number>;
  byPriority: Record<TodoPriority, number>;
  byComplianceStandard: Record<ComplianceStandard, number>;
  completionRate: number;
  overdueCount: number;
}

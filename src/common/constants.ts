// OpenSearch index configuration
export const TODO_INDEX_NAME = '.todo-items';
export const TODO_INDEX_PATTERN = '.todo-items*';

// API routes base path
export const API_BASE_PATH = '/api/custom_plugin';

// API endpoints
export const API_ROUTES = {
  TODOS: `${API_BASE_PATH}/todos`,
  TODO_BY_ID: `${API_BASE_PATH}/todos/{id}`,
  TODO_STATISTICS: `${API_BASE_PATH}/todos/statistics`,
  TODO_ARCHIVE: `${API_BASE_PATH}/todos/{id}/archive`,
  TODO_RESTORE: `${API_BASE_PATH}/todos/{id}/restore`,
} as const;

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 25;

// Default sort configuration
export const DEFAULT_SORT_FIELD = 'createdAt';
export const DEFAULT_SORT_ORDER = 'desc';

// Plugin metadata
export const PLUGIN_ID = 'customPlugin';
export const PLUGIN_NAME = 'Security TODO Manager';
export const PLUGIN_ICON = 'listAdd';

// Date format patterns
export const DATE_FORMAT = 'MMM D, YYYY';

import { HttpStart } from '../../../../../src/core/public';
import {
  TodoItem,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoSearchParams,
  PaginatedResponse,
  TodoStatistics,
} from '../../common/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * TodosApiService - HTTP client for TODO API
 */
export class TodosApiService {
  constructor(private readonly http: HttpStart) {}

  /**
   * Create a new TODO item
   */
  async createTodo(data: CreateTodoRequest): Promise<TodoItem> {
    const response = await this.http.post<ApiResponse<TodoItem>>('/api/custom_plugin/todos', {
      body: JSON.stringify(data),
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create TODO');
    }
    return response.data;
  }

  /**
   * Get TODO by ID
   */
  async getTodoById(id: string): Promise<TodoItem> {
    const response = await this.http.get<ApiResponse<TodoItem>>(`/api/custom_plugin/todos/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'TODO not found');
    }
    return response.data;
  }

  /**
   * Update a TODO item
   */
  async updateTodo(id: string, data: UpdateTodoRequest): Promise<TodoItem> {
    const response = await this.http.put<ApiResponse<TodoItem>>(`/api/custom_plugin/todos/${id}`, {
      body: JSON.stringify(data),
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update TODO');
    }
    return response.data;
  }

  /**
   * Delete a TODO item
   */
  async deleteTodo(id: string): Promise<void> {
    const response = await this.http.delete<ApiResponse<void>>(`/api/custom_plugin/todos/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete TODO');
    }
  }

  /**
   * Search TODOs with filters
   * Uses OSD http.get with query parameter object
   */
  async searchTodos(params: TodoSearchParams = {}): Promise<PaginatedResponse<TodoItem>> {
    // Build query object for OSD http service
    const query: Record<string, string | string[] | number | boolean> = {};
    
    if (params.query) query.query = params.query;
    if (params.status && params.status.length > 0) query.status = params.status;
    if (params.priority && params.priority.length > 0) query.priority = params.priority;
    if (params.tags && params.tags.length > 0) query.tags = params.tags;
    if (params.assignee) query.assignee = params.assignee;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    if (params.page) query.page = params.page;
    if (params.size) query.size = params.size;
    if (params.archived !== undefined) query.archived = params.archived;

    const response = await this.http.get<ApiResponse<PaginatedResponse<TodoItem>>>(
      '/api/custom_plugin/todos',
      { query }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to search TODOs');
    }
    return response.data;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<TodoStatistics> {
    const response = await this.http.get<ApiResponse<TodoStatistics>>('/api/custom_plugin/todos/statistics');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get statistics');
    }
    return response.data;
  }

  /**
   * Archive a TODO item
   */
  async archiveTodo(id: string): Promise<TodoItem> {
    const response = await this.http.post<ApiResponse<TodoItem>>(`/api/custom_plugin/todos/${id}/archive`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to archive TODO');
    }
    return response.data;
  }

  /**
   * Restore an archived TODO item
   */
  async restoreTodo(id: string): Promise<TodoItem> {
    const response = await this.http.post<ApiResponse<TodoItem>>(`/api/custom_plugin/todos/${id}/restore`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to restore TODO');
    }
    return response.data;
  }
}


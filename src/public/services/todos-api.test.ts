import { TodosApiService } from './todos-api';
import { TodoPriority, TodoStatus } from '../../common/types';

// Mock HttpStart
const createMockHttp = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});

describe('TodosApiService', () => {
  let service: TodosApiService;
  let mockHttp: ReturnType<typeof createMockHttp>;

  beforeEach(() => {
    mockHttp = createMockHttp();
    service = new TodosApiService(mockHttp as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTodo', () => {
    it('should create a new todo successfully', async () => {
      const mockTodo = {
        id: '123',
        title: 'Test Todo',
        status: TodoStatus.PLANNED,
        priority: TodoPriority.MEDIUM,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockHttp.post.mockResolvedValue({ success: true, data: mockTodo });

      const result = await service.createTodo({ title: 'Test Todo', priority: TodoPriority.MEDIUM });

      expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos', {
        body: JSON.stringify({ title: 'Test Todo', priority: TodoPriority.MEDIUM }),
      });
      expect(result).toEqual(mockTodo);
    });

    it('should throw error when create fails', async () => {
      mockHttp.post.mockResolvedValue({ success: false, message: 'Create failed' });

      await expect(service.createTodo({ title: 'Test', priority: TodoPriority.LOW }))
        .rejects.toThrow('Create failed');
    });

    it('should throw default error when no message provided', async () => {
      mockHttp.post.mockResolvedValue({ success: false });

      await expect(service.createTodo({ title: 'Test', priority: TodoPriority.LOW }))
        .rejects.toThrow('Failed to create TODO');
    });
  });

  describe('getTodoById', () => {
    it('should fetch a todo by id', async () => {
      const mockTodo = { id: '123', title: 'Test', status: TodoStatus.PLANNED };
      mockHttp.get.mockResolvedValue({ success: true, data: mockTodo });

      const result = await service.getTodoById('123');

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos/123');
      expect(result).toEqual(mockTodo);
    });

    it('should throw error when todo not found', async () => {
      mockHttp.get.mockResolvedValue({ success: false, message: 'Not found' });

      await expect(service.getTodoById('nonexistent')).rejects.toThrow('Not found');
    });

    it('should throw default error when no message provided', async () => {
      mockHttp.get.mockResolvedValue({ success: false });

      await expect(service.getTodoById('123')).rejects.toThrow('TODO not found');
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      const updatedTodo = { id: '123', title: 'Updated', status: TodoStatus.IN_PROGRESS };
      mockHttp.put.mockResolvedValue({ success: true, data: updatedTodo });

      const result = await service.updateTodo('123', { title: 'Updated' });

      expect(mockHttp.put).toHaveBeenCalledWith('/api/custom_plugin/todos/123', {
        body: JSON.stringify({ title: 'Updated' }),
      });
      expect(result).toEqual(updatedTodo);
    });

    it('should throw error when update fails', async () => {
      mockHttp.put.mockResolvedValue({ success: false, message: 'Update failed' });

      await expect(service.updateTodo('123', { title: 'Updated' }))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      mockHttp.delete.mockResolvedValue({ success: true });

      await expect(service.deleteTodo('123')).resolves.toBeUndefined();
      expect(mockHttp.delete).toHaveBeenCalledWith('/api/custom_plugin/todos/123');
    });

    it('should throw error when delete fails', async () => {
      mockHttp.delete.mockResolvedValue({ success: false, message: 'Delete failed' });

      await expect(service.deleteTodo('123')).rejects.toThrow('Delete failed');
    });
  });

  describe('searchTodos', () => {
    it('should search todos with filters', async () => {
      const mockResponse = {
        items: [{ id: '1', title: 'Test' }],
        total: 1,
        page: 1,
        size: 10,
      };
      mockHttp.get.mockResolvedValue({ success: true, data: mockResponse });

      const result = await service.searchTodos({
        query: 'test',
        status: [TodoStatus.PLANNED],
        priority: [TodoPriority.HIGH],
        page: 1,
        size: 20,
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos', {
        query: {
          query: 'test',
          status: [TodoStatus.PLANNED],
          priority: [TodoPriority.HIGH],
          page: 1,
          size: 20,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should search with empty params', async () => {
      const mockResponse = { items: [], total: 0, page: 1, size: 10 };
      mockHttp.get.mockResolvedValue({ success: true, data: mockResponse });

      await service.searchTodos();

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos', { query: {} });
    });

    it('should include archived filter when specified', async () => {
      mockHttp.get.mockResolvedValue({ success: true, data: { items: [] } });

      await service.searchTodos({ archived: true });

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos', {
        query: { archived: true },
      });
    });

    it('should include all filter params when provided', async () => {
      mockHttp.get.mockResolvedValue({ success: true, data: { items: [] } });

      await service.searchTodos({
        query: 'search',
        status: [TodoStatus.IN_PROGRESS],
        priority: [TodoPriority.CRITICAL],
        tags: ['bug', 'urgent'],
        assignee: 'John',
        sortField: 'createdAt',
        sortOrder: 'desc',
        page: 2,
        size: 50,
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos', {
        query: {
          query: 'search',
          status: [TodoStatus.IN_PROGRESS],
          priority: [TodoPriority.CRITICAL],
          tags: ['bug', 'urgent'],
          assignee: 'John',
          sortField: 'createdAt',
          sortOrder: 'desc',
          page: 2,
          size: 50,
        },
      });
    });

    it('should throw error when search fails', async () => {
      mockHttp.get.mockResolvedValue({ success: false, message: 'Search failed' });

      await expect(service.searchTodos({})).rejects.toThrow('Search failed');
    });
  });

  describe('getStatistics', () => {
    it('should fetch statistics successfully', async () => {
      const mockStats = {
        totalCount: 10,
        completionRate: 50,
        overdueCount: 2,
        byStatus: {},
        byPriority: {},
        byComplianceStandard: {},
      };
      mockHttp.get.mockResolvedValue({ success: true, data: mockStats });

      const result = await service.getStatistics();

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos/statistics');
      expect(result).toEqual(mockStats);
    });

    it('should throw error when statistics fetch fails', async () => {
      mockHttp.get.mockResolvedValue({ success: false });

      await expect(service.getStatistics()).rejects.toThrow('Failed to get statistics');
    });
  });

  describe('archiveTodo', () => {
    it('should archive a todo successfully', async () => {
      const archivedTodo = { id: '123', title: 'Test', archived: true };
      mockHttp.post.mockResolvedValue({ success: true, data: archivedTodo });

      const result = await service.archiveTodo('123');

      expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos/123/archive');
      expect(result).toEqual(archivedTodo);
    });

    it('should throw error when archive fails', async () => {
      mockHttp.post.mockResolvedValue({ success: false, message: 'Archive failed' });

      await expect(service.archiveTodo('123')).rejects.toThrow('Archive failed');
    });
  });

  describe('restoreTodo', () => {
    it('should restore a todo successfully', async () => {
      const restoredTodo = { id: '123', title: 'Test', archived: false };
      mockHttp.post.mockResolvedValue({ success: true, data: restoredTodo });

      const result = await service.restoreTodo('123');

      expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos/123/restore');
      expect(result).toEqual(restoredTodo);
    });

    it('should throw error when restore fails', async () => {
      mockHttp.post.mockResolvedValue({ success: false, message: 'Restore failed' });

      await expect(service.restoreTodo('123')).rejects.toThrow('Restore failed');
    });
  });

  describe('bulk operations', () => {
    describe('bulkArchive', () => {
      it('should bulk archive todos successfully', async () => {
        const mockResult = { processed: 3, failed: 0 };
        mockHttp.post.mockResolvedValue({ success: true, data: mockResult });

        const result = await service.bulkArchive(['1', '2', '3']);

        expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos/bulk/archive', {
          body: JSON.stringify({ ids: ['1', '2', '3'] }),
        });
        expect(result).toEqual(mockResult);
      });

      it('should throw error when bulk archive fails', async () => {
        mockHttp.post.mockResolvedValue({ success: false });

        await expect(service.bulkArchive(['1'])).rejects.toThrow('Failed to bulk archive TODOs');
      });
    });

    describe('bulkRestore', () => {
      it('should bulk restore todos successfully', async () => {
        const mockResult = { processed: 2, failed: 1, errors: [{ id: '3', error: 'Not found' }] };
        mockHttp.post.mockResolvedValue({ success: true, data: mockResult });

        const result = await service.bulkRestore(['1', '2', '3']);

        expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos/bulk/restore', {
          body: JSON.stringify({ ids: ['1', '2', '3'] }),
        });
        expect(result).toEqual(mockResult);
      });

      it('should throw error when bulk restore fails', async () => {
        mockHttp.post.mockResolvedValue({ success: false, message: 'Bulk restore error' });

        await expect(service.bulkRestore(['1'])).rejects.toThrow('Bulk restore error');
      });
    });

    describe('bulkDelete', () => {
      it('should bulk delete todos successfully', async () => {
        const mockResult = { processed: 5, failed: 0 };
        mockHttp.post.mockResolvedValue({ success: true, data: mockResult });

        const result = await service.bulkDelete(['1', '2', '3', '4', '5']);

        expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos/bulk/delete', {
          body: JSON.stringify({ ids: ['1', '2', '3', '4', '5'] }),
        });
        expect(result).toEqual(mockResult);
      });

      it('should throw error when bulk delete fails', async () => {
        mockHttp.post.mockResolvedValue({ success: false });

        await expect(service.bulkDelete(['1'])).rejects.toThrow('Failed to bulk delete TODOs');
      });
    });
  });

  describe('error handling', () => {
    it('should propagate network errors', async () => {
      const networkError = new Error('Network error');
      mockHttp.get.mockRejectedValue(networkError);

      await expect(service.getTodoById('123')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockHttp.post.mockRejectedValue(timeoutError);

      await expect(service.createTodo({ title: 'Test', priority: TodoPriority.LOW }))
        .rejects.toThrow('Request timeout');
    });
  });
});


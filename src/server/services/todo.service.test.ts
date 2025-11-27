/**
 * Tests for TodoService - Backend business logic
 */
import { TodoService } from './todo.service';
import { OpenSearchService } from './opensearch.service';
import { Logger } from 'src/core/server';
import { TodoStatus, TodoPriority } from '../../common/types';
import { TODO_INDEX_NAME } from '../../common/constants';

// Mock OpenSearch client
const mockClient = {
  index: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  bulk: jest.fn(),
};

const mockOsService = {
  ensureIndex: jest.fn(),
  getClient: jest.fn().mockReturnValue(mockClient),
} as unknown as OpenSearchService;

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockOsService.ensureIndex as jest.Mock).mockResolvedValue(undefined);
    service = new TodoService(mockOsService, mockLogger);
  });

  describe('CRUD Operations', () => {
    it('should create a todo with defaults', async () => {
      mockClient.index.mockResolvedValue({ body: { _id: 'test-123' } });

      const result = await service.createTodo({
        title: 'Test Todo',
        priority: TodoPriority.HIGH,
      });

      expect(result.title).toBe('Test Todo');
      expect(result.status).toBe(TodoStatus.PLANNED);
      expect(result.archived).toBe(false);
      expect(mockClient.index).toHaveBeenCalledWith(
        expect.objectContaining({ index: TODO_INDEX_NAME })
      );
    });

    it('should get a todo by ID', async () => {
      mockClient.get.mockResolvedValue({
        body: { _source: { id: 'test-id', title: 'Found Todo' } },
      });

      const result = await service.getTodoById('test-id');
      expect(result?.title).toBe('Found Todo');
    });

    it('should return null for non-existent todo', async () => {
      const error: any = new Error('Not found');
      error.statusCode = 404;
      mockClient.get.mockRejectedValue(error);

      const result = await service.getTodoById('non-existent');
      expect(result).toBeNull();
    });

    it('should update a todo', async () => {
      mockClient.get.mockResolvedValue({
        body: { _source: { id: 'test-id', title: 'Old', status: TodoStatus.PLANNED } },
      });
      mockClient.update.mockResolvedValue({});

      const result = await service.updateTodo('test-id', { title: 'New Title' });
      
      expect(result.title).toBe('New Title');
      expect(mockClient.update).toHaveBeenCalled();
    });

    it('should delete a todo', async () => {
      mockClient.delete.mockResolvedValue({});

      await service.deleteTodo('test-id');
      
      expect(mockClient.delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-id' })
      );
    });
  });

  describe('Archive & Restore', () => {
    it('should archive and restore todos', async () => {
      mockClient.get.mockResolvedValue({
        body: { _source: { id: 'test-id', archived: false } },
      });
      mockClient.update.mockResolvedValue({});

      const archived = await service.archiveTodo('test-id');
      expect(archived.archived).toBe(true);

      mockClient.get.mockResolvedValue({
        body: { _source: { id: 'test-id', archived: true } },
      });

      const restored = await service.restoreTodo('test-id');
      expect(restored.archived).toBe(false);
    });
  });

  describe('Search', () => {
    it('should search todos with filters', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 2 },
            hits: [
              { _source: { id: '1', title: 'Todo 1' } },
              { _source: { id: '2', title: 'Todo 2' } },
            ],
          },
        },
      });

      const result = await service.searchTodos({ status: [TodoStatus.PLANNED] });
      
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk archive todos', async () => {
      mockClient.bulk.mockResolvedValue({
        body: {
          errors: false,
          items: [{ update: { status: 200 } }, { update: { status: 200 } }],
        },
      });

      const result = await service.bulkArchive(['id1', 'id2']);
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
    });

    it('should handle bulk operation failures', async () => {
      mockClient.bulk.mockResolvedValue({
        body: {
          errors: true,
          items: [
            { update: { status: 200 } },
            { update: { error: { reason: 'Failed' } } },
          ],
        },
      });

      const result = await service.bulkArchive(['id1', 'id2']);
      
      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should return aggregated statistics', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { total: { value: 10 } },
          aggregations: {
            by_status: { buckets: [{ key: TodoStatus.COMPLETED_SUCCESS, doc_count: 4 }] },
            by_priority: { buckets: [{ key: TodoPriority.HIGH, doc_count: 3 }] },
            by_compliance_standard: { buckets: [] },
            completed_items: { doc_count: 4 },
            overdue_items: { doc_count: 2 },
          },
        },
      });

      const stats = await service.getStatistics();
      
      expect(stats.totalCount).toBe(10);
      expect(stats.completionRate).toBe(40);
      expect(stats.overdueCount).toBe(2);
    });
  });
});

import { IRouter, CoreSetup, Logger } from 'src/core/server';
import { schema } from '@osd/config-schema';
import { TodoService } from '../services/todo.service';
import { OpenSearchService } from '../services/opensearch.service';
import { 
  createTodoSchema, 
  updateTodoSchema, 
  searchTodoSchema,
  idParamSchema,
  bulkIdsSchema,
  bulkUpdateStatusSchema,
  bulkUpdatePrioritySchema,
  bulkAssignSchema,
} from '../../common/schemas/todo_schema';
import { TodoSearchParams, TodoStatus, TodoPriority } from '../../common/types';
import { generateTodos, SEED_CONFIG } from '../scripts/seed-todos';

// Helper to create TodoService instance
function createTodoService(context: any, logger: Logger): TodoService {
  const client = context.core.opensearch.client.asCurrentUser;
  const osService = new OpenSearchService(logger);
  osService.setClient(client);
  return new TodoService(osService, logger);
}

// Parse query parameters from strings to proper types
function parseSearchParams(query: any): TodoSearchParams {
  const params: TodoSearchParams = {};

  if (query.query) params.query = query.query;
  if (query.assignee) params.assignee = query.assignee;
  if (query.sortField) params.sortField = query.sortField;
  if (query.sortOrder) params.sortOrder = query.sortOrder;
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;

  // Parse arrays (can be string or array)
  if (query.status) {
    params.status = Array.isArray(query.status) ? query.status : [query.status];
  }
  if (query.priority) {
    params.priority = Array.isArray(query.priority) ? query.priority : [query.priority];
  }
  if (query.tags) {
    params.tags = Array.isArray(query.tags) ? query.tags : [query.tags];
  }
  if (query.complianceStandards) {
    params.complianceStandards = Array.isArray(query.complianceStandards) 
      ? query.complianceStandards 
      : [query.complianceStandards];
  }

  // Parse numbers
  if (query.page !== undefined) {
    params.page = typeof query.page === 'string' ? parseInt(query.page, 10) : query.page;
  }
  if (query.size !== undefined) {
    params.size = typeof query.size === 'string' ? parseInt(query.size, 10) : query.size;
  }

  // Parse boolean
  if (query.archived !== undefined) {
    if (typeof query.archived === 'string') {
      params.archived = query.archived === 'true';
    } else {
      params.archived = query.archived;
    }
  }

  return params;
}


// Register TODO API routes
export function registerTodoRoutes(
  router: IRouter, 
  core: CoreSetup,
  logger: Logger
) {
  // ============================================
  // CRUD Operations
  // ============================================

  // GET /api/custom_plugin/todos - List all TODOs
  router.get(
    {
      path: '/api/custom_plugin/todos',
      validate: {
        query: searchTodoSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const searchParams = parseSearchParams(request.query || {});
        const results = await service.searchTodos(searchParams);
        
        return response.ok({ 
          body: { 
            success: true,
            data: results 
          } 
        });
      } catch (error) {
        logger.error('Error listing TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to list TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos - Create TODO
  router.post(
    {
      path: '/api/custom_plugin/todos',
      validate: {
        body: createTodoSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const todo = await service.createTodo(request.body);
        
        return response.ok({ 
          body: { 
            success: true,
            data: todo 
          } 
        });
      } catch (error) {
        logger.error('Error creating TODO', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to create TODO item',
            error: error.message 
          },
        });
      }
    }
  );

  // GET /api/custom_plugin/todos/{id} - Get TODO by ID
  router.get(
    {
      path: '/api/custom_plugin/todos/{id}',
      validate: {
        params: idParamSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const todo = await service.getTodoById(request.params.id);
        
        if (!todo) {
          return response.notFound({ 
            body: { 
              success: false,
              message: 'TODO item not found' 
            } 
          });
        }
        
        return response.ok({ 
          body: { 
            success: true,
            data: todo 
          } 
        });
      } catch (error) {
        logger.error('Error fetching TODO', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to fetch TODO item',
            error: error.message 
          },
        });
      }
    }
  );

  // PUT /api/custom_plugin/todos/{id} - Update TODO
  router.put(
    {
      path: '/api/custom_plugin/todos/{id}',
      validate: {
        params: idParamSchema,
        body: updateTodoSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const todo = await service.updateTodo(request.params.id, request.body);
        
        return response.ok({ 
          body: { 
            success: true,
            data: todo 
          } 
        });
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return response.notFound({ 
            body: { 
              success: false,
              message: error.message 
            } 
          });
        }
        logger.error('Error updating TODO', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to update TODO item',
            error: error.message 
          },
        });
      }
    }
  );

  // DELETE /api/custom_plugin/todos/{id} - Delete TODO
  router.delete(
    {
      path: '/api/custom_plugin/todos/{id}',
      validate: {
        params: idParamSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        await service.deleteTodo(request.params.id);
        
        return response.ok({ 
          body: { 
            success: true,
            message: 'TODO item deleted successfully' 
          } 
        });
      } catch (error) {
        logger.error('Error deleting TODO', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to delete TODO item',
            error: error.message 
          },
        });
      }
    }
  );

  // ============================================
  // Search & Statistics
  // ============================================

  // POST /api/custom_plugin/todos/search - Search TODOs
  router.post(
    {
      path: '/api/custom_plugin/todos/search',
      validate: {
        body: searchTodoSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const results = await service.searchTodos(request.body);
        
        return response.ok({ 
          body: { 
            success: true,
            data: results 
          } 
        });
      } catch (error) {
        logger.error('Error searching TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to search TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // GET /api/custom_plugin/todos/statistics - Get statistics
  router.get(
    {
      path: '/api/custom_plugin/todos/statistics',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const stats = await service.getStatistics();
        
        return response.ok({ 
          body: { 
            success: true,
            data: stats 
          } 
        });
      } catch (error) {
        logger.error('Error fetching statistics', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message 
          },
        });
      }
    }
  );

  // ============================================
  // Archive & Restore (Single)
  // ============================================

  // POST /api/custom_plugin/todos/{id}/archive - Archive TODO
  router.post(
    {
      path: '/api/custom_plugin/todos/{id}/archive',
      validate: {
        params: idParamSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const todo = await service.archiveTodo(request.params.id);
        
        return response.ok({ 
          body: { 
            success: true,
            data: todo,
            message: 'TODO item archived successfully'
          } 
        });
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return response.notFound({ 
            body: { 
              success: false,
              message: error.message 
            } 
          });
        }
        logger.error('Error archiving TODO', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to archive TODO item',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos/{id}/restore - Restore archived TODO
  router.post(
    {
      path: '/api/custom_plugin/todos/{id}/restore',
      validate: {
        params: idParamSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const todo = await service.restoreTodo(request.params.id);
        
        return response.ok({ 
          body: { 
            success: true,
            data: todo,
            message: 'TODO item restored successfully'
          } 
        });
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return response.notFound({ 
            body: { 
              success: false,
              message: error.message 
            } 
          });
        }
        logger.error('Error restoring TODO', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to restore TODO item',
            error: error.message 
          },
        });
      }
    }
  );

  // ============================================
  // Bulk Operations
  // ============================================

  // POST /api/custom_plugin/todos/bulk/delete - Bulk delete TODOs
  router.post(
    {
      path: '/api/custom_plugin/todos/bulk/delete',
      validate: {
        body: bulkIdsSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const result = await service.bulkDelete(request.body.ids);
        
        return response.ok({ 
          body: { 
            success: result.success,
            data: result,
            message: `Deleted ${result.processed} TODO items`
          } 
        });
      } catch (error) {
        logger.error('Error bulk deleting TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to bulk delete TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos/bulk/archive - Bulk archive TODOs
  router.post(
    {
      path: '/api/custom_plugin/todos/bulk/archive',
      validate: {
        body: bulkIdsSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const result = await service.bulkArchive(request.body.ids);
        
        return response.ok({ 
          body: { 
            success: result.success,
            data: result,
            message: `Archived ${result.processed} TODO items`
          } 
        });
      } catch (error) {
        logger.error('Error bulk archiving TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to bulk archive TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos/bulk/restore - Bulk restore TODOs
  router.post(
    {
      path: '/api/custom_plugin/todos/bulk/restore',
      validate: {
        body: bulkIdsSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const result = await service.bulkRestore(request.body.ids);
        
        return response.ok({ 
          body: { 
            success: result.success,
            data: result,
            message: `Restored ${result.processed} TODO items`
          } 
        });
      } catch (error) {
        logger.error('Error bulk restoring TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to bulk restore TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos/bulk/status - Bulk update status
  router.post(
    {
      path: '/api/custom_plugin/todos/bulk/status',
      validate: {
        body: bulkUpdateStatusSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const { ids, status } = request.body;
        const result = await service.bulkUpdateStatus(ids, status as TodoStatus);
        
        return response.ok({ 
          body: { 
            success: result.success,
            data: result,
            message: `Updated status of ${result.processed} TODO items to "${status}"`
          } 
        });
      } catch (error) {
        logger.error('Error bulk updating status', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to bulk update status',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos/bulk/priority - Bulk update priority
  router.post(
    {
      path: '/api/custom_plugin/todos/bulk/priority',
      validate: {
        body: bulkUpdatePrioritySchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const { ids, priority } = request.body;
        const result = await service.bulkUpdatePriority(ids, priority as TodoPriority);
        
        return response.ok({ 
          body: { 
            success: result.success,
            data: result,
            message: `Updated priority of ${result.processed} TODO items to "${priority}"`
          } 
        });
      } catch (error) {
        logger.error('Error bulk updating priority', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to bulk update priority',
            error: error.message 
          },
        });
      }
    }
  );

  // POST /api/custom_plugin/todos/bulk/assign - Bulk assign TODOs
  router.post(
    {
      path: '/api/custom_plugin/todos/bulk/assign',
      validate: {
        body: bulkAssignSchema,
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const { ids, assignee } = request.body;
        const result = await service.bulkAssign(ids, assignee);
        
        return response.ok({ 
          body: { 
            success: result.success,
            data: result,
            message: assignee 
              ? `Assigned ${result.processed} TODO items to "${assignee}"`
              : `Unassigned ${result.processed} TODO items`
          } 
        });
      } catch (error) {
        logger.error('Error bulk assigning TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to bulk assign TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // ============================================
  // Seed & Testing Endpoints
  // ============================================

  // POST /api/custom_plugin/todos/seed - Seed test data (for performance testing)
  router.post(
    {
      path: '/api/custom_plugin/todos/seed',
      validate: {
        body: schema.object({
          count: schema.number({ defaultValue: SEED_CONFIG.TOTAL_TODOS, min: 1, max: 10000 }),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const count = request.body.count;
        
        logger.info(`Starting seed of ${count} TODO items...`);
        const startTime = Date.now();
        
        // Generate and insert in batches
        const batchSize = SEED_CONFIG.BATCH_SIZE;
        let totalProcessed = 0;
        let totalFailed = 0;
        
        for (let i = 0; i < count; i += batchSize) {
          const batchCount = Math.min(batchSize, count - i);
          const todos = generateTodos(batchCount);
          const result = await service.bulkCreate(todos);
          totalProcessed += result.processed;
          totalFailed += result.failed;
        }
        
        const duration = Date.now() - startTime;
        logger.info(`Seed completed: ${totalProcessed} created, ${totalFailed} failed in ${duration}ms`);
        
        return response.ok({ 
          body: { 
            success: totalFailed === 0,
            data: {
              requested: count,
              processed: totalProcessed,
              failed: totalFailed,
              duration: `${duration}ms`,
            },
            message: `Seeded ${totalProcessed} TODO items in ${duration}ms`
          } 
        });
      } catch (error) {
        logger.error('Error seeding TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to seed TODO items',
            error: error.message 
          },
        });
      }
    }
  );

  // DELETE /api/custom_plugin/todos/all - Delete all TODOs (for cleanup after testing)
  router.delete(
    {
      path: '/api/custom_plugin/todos/all',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const service = createTodoService(context, logger);
        const result = await service.deleteAll();
        
        return response.ok({ 
          body: { 
            success: true,
            data: result,
            message: `Deleted ${result.deleted} TODO items`
          } 
        });
      } catch (error) {
        logger.error('Error deleting all TODOs', error);
        return response.customError({
          statusCode: 500,
          body: { 
            success: false,
            message: 'Failed to delete all TODO items',
            error: error.message 
          },
        });
      }
    }
  );
}

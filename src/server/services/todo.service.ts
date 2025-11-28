import { v4 as uuidv4 } from "uuid";
import { Logger } from "src/core/server";
import { OpenSearchService } from "./opensearch.service";
import {
  TodoItem,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoSearchParams,
  PaginatedResponse,
  TodoStatistics,
  TodoStatus,
  TodoPriority,
} from "../../common/types";
import {
  TODO_INDEX_NAME,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
} from "../../common/constants";

type FilterCondition = Record<string, any>;

interface FilterBuilder {
  addTerm: (field: string, value: any) => FilterBuilder;
  addTerms: (field: string, values: any[] | undefined) => FilterBuilder;
  addRange: (field: string, gte?: string, lte?: string) => FilterBuilder;
  addMatch: (
    fields: string[],
    query: string,
    boost?: Record<string, number>
  ) => FilterBuilder;
  build: () => { must: FilterCondition[]; filter: FilterCondition[] };
}

const createFilterBuilder = (): FilterBuilder => {
  const must: FilterCondition[] = [];
  const filter: FilterCondition[] = [];

  return {
    addTerm(field: string, value: any) {
      if (value !== undefined && value !== null && value !== "") {
        filter.push({ term: { [field]: value } });
      }
      return this;
    },

    addTerms(field: string, values: any[] | undefined) {
      if (values && values.length > 0) {
        filter.push({ terms: { [field]: values } });
      }
      return this;
    },

    addRange(field: string, gte?: string, lte?: string) {
      if (gte || lte) {
        const range: Record<string, string> = {};
        if (gte) range.gte = gte;
        if (lte) range.lte = lte;
        filter.push({ range: { [field]: range } });
      }
      return this;
    },

    addMatch(fields: string[], query: string, boost?: Record<string, number>) {
      if (query && query.trim()) {
        const normalizedQuery = query.trim().toLowerCase();
        const fieldsWithBoost = fields.map((f) =>
          boost?.[f] ? `${f}^${boost[f]}` : f
        );
        must.push({
          multi_match: {
            query: normalizedQuery,
            fields: fieldsWithBoost,
            type: "phrase_prefix",
            operator: "or",
          },
        });
      }
      return this;
    },

    build() {
      return { must, filter };
    },
  };
};

// Bulk Operation Result
export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

export class TodoService {
  constructor(
    private readonly osService: OpenSearchService,
    private readonly logger: Logger
  ) {
    this.initialize();
  }

  private async initialize() {
    try {
      await this.osService.ensureIndex();
    } catch (error) {
      this.logger.error("Failed to initialize TodoService", error);
    }
  }

  public async createTodo(data: CreateTodoRequest): Promise<TodoItem> {
    const client = this.osService.getClient();
    const now = new Date().toISOString();
    const status = data.status || TodoStatus.PLANNED;

    // Get max position in the target status column to add at the end
    const maxPosition = await this.getMaxPositionInStatus(status);

    const todo: TodoItem = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      status,
      priority: data.priority || TodoPriority.MEDIUM,
      tags: data.tags || [],
      complianceStandards: data.complianceStandards || [],
      assignee: data.assignee,
      createdAt: now,
      updatedAt: now,
      plannedDate: data.plannedDate,
      dueDate: data.dueDate,
      archived: false,
      storyPoints: data.storyPoints,
      coverImage: data.coverImage,
      position: maxPosition + 1000, // Add at the end with 1000 increment
    };

    await client.index({
      index: TODO_INDEX_NAME,
      id: todo.id,
      body: todo,
      refresh: "wait_for",
    });

    this.logger.info(`Created TODO item: ${todo.id}`);
    return todo;
  }

  /**
   * Get the maximum position value in a status column
   */
  private async getMaxPositionInStatus(status: TodoStatus): Promise<number> {
    const client = this.osService.getClient();

    try {
      const response = await client.search({
        index: TODO_INDEX_NAME,
        body: {
          query: {
            bool: {
              filter: [{ term: { status } }, { term: { archived: false } }],
            },
          },
          sort: [{ position: { order: "desc" } }],
          size: 1,
          _source: ["position"],
        },
      });

      const hits = response.body.hits.hits;
      if (hits.length > 0 && hits[0]._source?.position != null) {
        return hits[0]._source.position;
      }
      return 0;
    } catch (error) {
      this.logger.warn("Error getting max position, defaulting to 0", error);
      return 0;
    }
  }

  public async getTodoById(id: string): Promise<TodoItem | null> {
    const client = this.osService.getClient();

    try {
      const response = await client.get({
        index: TODO_INDEX_NAME,
        id,
      });

      return response.body._source as TodoItem;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  public async updateTodo(
    id: string,
    data: UpdateTodoRequest
  ): Promise<TodoItem> {
    const client = this.osService.getClient();
    const existing = await this.getTodoById(id);

    if (!existing) {
      throw new Error(`TODO item not found: ${id}`);
    }

    const updated: TodoItem = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await client.update({
      index: TODO_INDEX_NAME,
      id,
      body: { doc: updated },
      refresh: "wait_for",
    });

    this.logger.info(`Updated TODO item: ${id}`);
    return updated;
  }

  public async deleteTodo(id: string): Promise<void> {
    const client = this.osService.getClient();

    await client.delete({
      index: TODO_INDEX_NAME,
      id,
      refresh: "wait_for",
    });

    this.logger.info(`Deleted TODO item: ${id}`);
  }

  public async searchTodos(
    params: TodoSearchParams
  ): Promise<PaginatedResponse<TodoItem>> {
    const client = this.osService.getClient();

    const {
      query,
      status,
      priority,
      tags,
      complianceStandards,
      assignee,
      dateFrom,
      dateTo,
      sortField = DEFAULT_SORT_FIELD,
      sortOrder = DEFAULT_SORT_ORDER,
      page = 1,
      size = DEFAULT_PAGE_SIZE,
      archived,
    } = params;

    // Build filters using the filter builder
    // Search in title and description (text fields) - tags is keyword type and handled separately
    const { must, filter } = createFilterBuilder()
      .addMatch(["title", "description"], query || "", {
        title: 2,
        description: 1,
      })
      .addTerm("archived", archived)
      .addTerm("assignee", assignee)
      .addTerms("status", status)
      .addTerms("priority", priority)
      .addTerms("tags", tags)
      .addTerms("complianceStandards", complianceStandards)
      .addRange("createdAt", dateFrom, dateTo)
      .build();

    const from = (page - 1) * size;

    // Build sort config with unmapped_type for fields that may not exist on all docs
    const sortConfig: Record<string, any> = {
      order: sortOrder,
      unmapped_type: sortField === "position" ? "long" : "date",
    };

    // For optional fields, put docs without the field at the end
    if (
      ["archivedAt", "completedAt", "dueDate", "position"].includes(sortField)
    ) {
      sortConfig.missing = sortOrder === "asc" ? "_last" : "_first";
    }

    const response = await client.search({
      index: TODO_INDEX_NAME,
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        sort: [{ [sortField]: sortConfig }],
        from,
        size,
      },
    });

    const hits = response.body.hits;
    const items = hits.hits.map((hit: any) => hit._source as TodoItem);
    const total = hits.total.value;

    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  public async archiveTodo(id: string): Promise<TodoItem> {
    return this.updateTodo(id, {
      archived: true,
      archivedAt: new Date().toISOString(),
    });
  }

  public async restoreTodo(id: string): Promise<TodoItem> {
    return this.updateTodo(id, {
      archived: false,
      archivedAt: undefined,
    });
  }

  public async reorderTodo(
    id: string,
    status: TodoStatus,
    position: number
  ): Promise<TodoItem> {
    return this.updateTodo(id, { status, position });
  }

  // ============================================
  // Bulk Operations
  // ============================================

  public async bulkUpdateStatus(
    ids: string[],
    status: TodoStatus
  ): Promise<BulkOperationResult> {
    return this.bulkUpdate(ids, { status });
  }

  public async bulkUpdate(
    ids: string[],
    updates: UpdateTodoRequest
  ): Promise<BulkOperationResult> {
    if (!ids || ids.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    const client = this.osService.getClient();
    const now = new Date().toISOString();

    const operations = ids.flatMap((id) => [
      { update: { _index: TODO_INDEX_NAME, _id: id } },
      { doc: { ...updates, updatedAt: now } },
    ]);

    const response = await client.bulk({
      body: operations,
      refresh: "wait_for",
    });

    const result = this.parseBulkResponse(response.body, ids);
    this.logger.info(
      `Bulk updated ${result.processed} TODO items, ${result.failed} failed`
    );

    return result;
  }

  public async bulkDelete(ids: string[]): Promise<BulkOperationResult> {
    if (!ids || ids.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    const client = this.osService.getClient();

    const operations = ids.map((id) => ({
      delete: { _index: TODO_INDEX_NAME, _id: id },
    }));

    const response = await client.bulk({
      body: operations,
      refresh: "wait_for",
    });

    const result = this.parseBulkResponse(response.body, ids);
    this.logger.info(
      `Bulk deleted ${result.processed} TODO items, ${result.failed} failed`
    );

    return result;
  }

  public async bulkArchive(ids: string[]): Promise<BulkOperationResult> {
    const now = new Date().toISOString();
    return this.bulkUpdate(ids, {
      archived: true,
      archivedAt: now,
    });
  }

  public async bulkRestore(ids: string[]): Promise<BulkOperationResult> {
    return this.bulkUpdate(ids, {
      archived: false,
      archivedAt: undefined,
    });
  }

  public async bulkUpdatePriority(
    ids: string[],
    priority: TodoPriority
  ): Promise<BulkOperationResult> {
    return this.bulkUpdate(ids, { priority });
  }

  public async bulkAssign(
    ids: string[],
    assignee: string | undefined
  ): Promise<BulkOperationResult> {
    return this.bulkUpdate(ids, { assignee });
  }

  private parseBulkResponse(response: any, ids: string[]): BulkOperationResult {
    const errors: Array<{ id: string; error: string }> = [];
    let failed = 0;

    if (response.errors) {
      response.items.forEach((item: any, index: number) => {
        const operation = item.update || item.delete || item.index;
        if (operation?.error) {
          failed++;
          errors.push({
            id: ids[index],
            error: operation.error.reason || "Unknown error",
          });
        }
      });
    }

    return {
      success: failed === 0,
      processed: ids.length - failed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ============================================
  // Seed / Bulk Create (for testing)
  // ============================================

  /**
   * Bulk create multiple TODOs (used for seeding test data)
   */
  public async bulkCreate(
    todos: Omit<TodoItem, "id">[]
  ): Promise<BulkOperationResult> {
    if (!todos || todos.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    const client = this.osService.getClient();
    const ids: string[] = [];

    const operations = todos.flatMap((todo) => {
      const id = uuidv4();
      ids.push(id);
      return [{ index: { _index: TODO_INDEX_NAME, _id: id } }, { ...todo, id }];
    });

    const response = await client.bulk({
      body: operations,
      refresh: "wait_for",
    });

    const result = this.parseBulkResponse(response.body, ids);
    this.logger.info(
      `Bulk created ${result.processed} TODO items, ${result.failed} failed`
    );

    return result;
  }

  /**
   * Delete all TODOs (for testing cleanup)
   */
  public async deleteAll(): Promise<{ deleted: number }> {
    const client = this.osService.getClient();

    const response = await client.deleteByQuery({
      index: TODO_INDEX_NAME,
      body: {
        query: { match_all: {} },
      },
      refresh: true,
    });

    const deleted = response.body.deleted || 0;
    this.logger.info(`Deleted all ${deleted} TODO items`);

    return { deleted };
  }

  // ============================================
  // Statistics
  // ============================================

  public async getStatistics(): Promise<TodoStatistics> {
    const client = this.osService.getClient();

    const response = await client.search({
      index: TODO_INDEX_NAME,
      body: {
        size: 0,
        // Only include non-archived items in statistics
        query: {
          term: { archived: false },
        },
        aggs: {
          by_status: {
            terms: { field: "status" },
          },
          by_priority: {
            terms: { field: "priority" },
          },
          by_compliance_standard: {
            terms: { field: "complianceStandards" },
          },
          completed_items: {
            filter: { term: { status: "completed_success" } },
          },
          overdue_items: {
            filter: {
              bool: {
                must: [
                  { range: { dueDate: { lt: "now" } } },
                  { terms: { status: ["planned", "in_progress"] } },
                ],
              },
            },
          },
        },
      },
    });

    const aggs = response.body.aggregations;
    const total = response.body.hits.total.value;

    return {
      totalCount: total,
      byStatus: this.aggregationToRecord(aggs.by_status),
      byPriority: this.aggregationToRecord(aggs.by_priority),
      byComplianceStandard: this.aggregationToRecord(
        aggs.by_compliance_standard
      ),
      completionRate:
        total > 0 ? (aggs.completed_items.doc_count / total) * 100 : 0,
      overdueCount: aggs.overdue_items.doc_count,
    };
  }

  private aggregationToRecord(agg: any): Record<string, number> {
    const result: Record<string, number> = {};
    if (agg && agg.buckets) {
      agg.buckets.forEach((bucket: any) => {
        result[bucket.key] = bucket.doc_count;
      });
    }
    return result;
  }
}

import { OpenSearchClient, Logger } from "src/core/server";
import { TODO_INDEX_NAME } from "../../common/constants";

const TODO_INDEX_TEMPLATE = {
  index_patterns: [".todo-items*"],
  template: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
      "index.refresh_interval": "5s",
    },
    mappings: {
      properties: {
        id: { type: "keyword" },
        title: {
          type: "text",
          fields: {
            keyword: { type: "keyword" },
          },
        },
        description: { type: "text" },
        status: { type: "keyword" },
        priority: { type: "keyword" },
        tags: { type: "keyword" },
        complianceStandards: { type: "keyword" },
        assignee: { type: "keyword" },
        createdAt: { type: "date" },
        updatedAt: { type: "date" },
        plannedDate: { type: "date" },
        completedAt: { type: "date" },
        dueDate: { type: "date" },
        errorDetails: { type: "text" },
      },
    },
  },
};

export class OpenSearchService {
  private client: OpenSearchClient | null = null;

  constructor(private readonly logger: Logger) {}

  public setClient(client: OpenSearchClient): void {
    this.client = client;
    this.logger.info("OpenSearch client set");
  }

  public getClient(): OpenSearchClient {
    if (!this.client) {
      throw new Error("OpenSearch client not initialized");
    }
    return this.client;
  }

  public async ensureIndex(): Promise<void> {
    try {
      const client = this.getClient();

      const templateExists = await client.indices.existsIndexTemplate({
        name: "todo-items-template",
      });

      if (!templateExists.body) {
        await client.indices.putIndexTemplate({
          name: "todo-items-template",
          body: TODO_INDEX_TEMPLATE,
        });
        this.logger.info("Created TODO index template");
      }

      const indexExists = await client.indices.exists({
        index: TODO_INDEX_NAME,
      });

      if (!indexExists.body) {
        await client.indices.create({
          index: TODO_INDEX_NAME,
        });
        this.logger.info(`Created index: ${TODO_INDEX_NAME}`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring index: ${error}`);
      throw error;
    }
  }

  public async getIndexHealth() {
    const client = this.getClient();
    const health = await client.cluster.health({
      index: TODO_INDEX_NAME,
    });
    return health.body;
  }
}

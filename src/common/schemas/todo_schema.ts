import { schema, TypeOf } from '@osd/config-schema';

/**
 * Schema for creating a TODO item
 */
export const createTodoSchema = schema.object({
  title: schema.string({ minLength: 1, maxLength: 200 }),
  description: schema.maybe(schema.string({ maxLength: 2000 })),
  priority: schema.oneOf([
    schema.literal('low'),
    schema.literal('medium'),
    schema.literal('high'),
    schema.literal('critical'),
  ]),
  status: schema.maybe(
    schema.oneOf([
      schema.literal('planned'),
      schema.literal('in_progress'),
      schema.literal('completed_success'),
      schema.literal('completed_error'),
      schema.literal('blocked'),
    ])
  ),
  tags: schema.maybe(schema.arrayOf(schema.string(), { maxSize: 20 })),
  complianceStandards: schema.maybe(
    schema.arrayOf(
      schema.oneOf([
        schema.literal('pci_dss'),
        schema.literal('iso_27001'),
        schema.literal('sox'),
        schema.literal('hipaa'),
        schema.literal('gdpr'),
        schema.literal('nist'),
      ]),
      { maxSize: 10 }
    )
  ),
  assignee: schema.maybe(schema.string({ maxLength: 100 })),
  plannedDate: schema.maybe(schema.string()),
  dueDate: schema.maybe(schema.string()),
  storyPoints: schema.maybe(schema.number({ min: 0, max: 100 })),
  coverImage: schema.maybe(schema.string({ maxLength: 500 })),
});

/**
 * Schema for updating a TODO item
 */
export const updateTodoSchema = schema.object({
  title: schema.maybe(schema.string({ minLength: 1, maxLength: 200 })),
  description: schema.maybe(schema.string({ maxLength: 2000 })),
  status: schema.maybe(
    schema.oneOf([
      schema.literal('planned'),
      schema.literal('in_progress'),
      schema.literal('completed_success'),
      schema.literal('completed_error'),
      schema.literal('blocked'),
    ])
  ),
  priority: schema.maybe(
    schema.oneOf([
      schema.literal('low'),
      schema.literal('medium'),
      schema.literal('high'),
      schema.literal('critical'),
    ])
  ),
  tags: schema.maybe(schema.arrayOf(schema.string(), { maxSize: 20 })),
  complianceStandards: schema.maybe(
    schema.arrayOf(
      schema.oneOf([
        schema.literal('pci_dss'),
        schema.literal('iso_27001'),
        schema.literal('sox'),
        schema.literal('hipaa'),
        schema.literal('gdpr'),
        schema.literal('nist'),
      ]),
      { maxSize: 10 }
    )
  ),
  assignee: schema.maybe(schema.string({ maxLength: 100 })),
  plannedDate: schema.maybe(schema.string()),
  dueDate: schema.maybe(schema.string()),
  completedAt: schema.maybe(schema.string()),
  errorDetails: schema.maybe(schema.string({ maxLength: 1000 })),
  archived: schema.maybe(schema.boolean()),
  archivedAt: schema.maybe(schema.string()),
  storyPoints: schema.maybe(schema.number({ min: 0, max: 100 })),
  coverImage: schema.maybe(schema.string({ maxLength: 500 })),
});

/**
 * Schema for search parameters
 * Note: Query params come as strings, so we use string types and convert in the service
 */
export const searchTodoSchema = schema.object({
  query: schema.maybe(schema.string({ maxLength: 500 })),
  status: schema.maybe(schema.oneOf([
    schema.string(),
    schema.arrayOf(schema.string()),
  ])),
  priority: schema.maybe(schema.oneOf([
    schema.string(),
    schema.arrayOf(schema.string()),
  ])),
  tags: schema.maybe(schema.oneOf([
    schema.string(),
    schema.arrayOf(schema.string()),
  ])),
  complianceStandards: schema.maybe(schema.oneOf([
    schema.string(),
    schema.arrayOf(schema.string()),
  ])),
  assignee: schema.maybe(schema.string()),
  dateFrom: schema.maybe(schema.string()),
  dateTo: schema.maybe(schema.string()),
  sortField: schema.maybe(schema.string()),
  sortOrder: schema.maybe(schema.oneOf([schema.literal('asc'), schema.literal('desc')])),
  page: schema.maybe(schema.oneOf([schema.number({ min: 1 }), schema.string()])),
  size: schema.maybe(schema.oneOf([schema.number({ min: 1, max: 100 }), schema.string()])),
  archived: schema.maybe(schema.oneOf([schema.boolean(), schema.string()])),
});

/**
 * Schema for route parameters with ID
 */
export const idParamSchema = schema.object({
  id: schema.string(),
});

export type CreateTodoSchema = TypeOf<typeof createTodoSchema>;
export type UpdateTodoSchema = TypeOf<typeof updateTodoSchema>;
export type SearchTodoSchema = TypeOf<typeof searchTodoSchema>;
export type IdParamSchema = TypeOf<typeof idParamSchema>;


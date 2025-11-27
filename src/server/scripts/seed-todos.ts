/**
 * Seed script to generate test TODOs for performance testing
 * Generates 3999 todos with realistic data distribution
 */
import { v4 as uuidv4 } from 'uuid';
import { TodoItem, TodoStatus, TodoPriority, ComplianceStandard } from '../../common/types';

const TOTAL_TODOS = 3999;

const statuses = Object.values(TodoStatus);
const priorities = Object.values(TodoPriority);
const standards = Object.values(ComplianceStandard);

const assignees = [
  'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 
  'Eve Wilson', 'Frank Miller', 'Grace Lee', 'Henry Davis',
  'Ivy Chen', 'Jack Taylor'
];

const tags = [
  'security', 'compliance', 'urgent', 'review', 'backend', 
  'frontend', 'bug', 'feature', 'refactor', 'documentation',
  'performance', 'testing', 'deployment', 'monitoring'
];

const verbs = [
  'Implement', 'Fix', 'Review', 'Update', 'Audit', 'Configure', 
  'Deploy', 'Test', 'Optimize', 'Refactor', 'Document', 'Migrate',
  'Investigate', 'Validate', 'Monitor', 'Analyze'
];

const nouns = [
  'authentication system', 'database indexes', 'API endpoints', 
  'dashboard widgets', 'security rules', 'compliance checks',
  'backup procedures', 'log rotation', 'user permissions',
  'rate limiting', 'cache layer', 'search functionality',
  'notification service', 'audit trail', 'data encryption'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTitle(): string {
  return `${getRandomElement(verbs)} ${getRandomElement(nouns)}`;
}

function getRandomTags(): string[] {
  const count = Math.floor(Math.random() * 4); // 0-3 tags
  const selected = new Set<string>();
  for (let i = 0; i < count; i++) {
    selected.add(getRandomElement(tags));
  }
  return Array.from(selected);
}

function getRandomStandards(): ComplianceStandard[] {
  const count = Math.floor(Math.random() * 3); // 0-2 standards
  const selected = new Set<ComplianceStandard>();
  for (let i = 0; i < count; i++) {
    selected.add(getRandomElement(standards));
  }
  return Array.from(selected);
}

function getRandomDate(daysAgo: number, daysAhead: number): string {
  const now = Date.now();
  const offset = (Math.random() * (daysAhead + daysAgo) - daysAgo) * 24 * 60 * 60 * 1000;
  return new Date(now + offset).toISOString();
}

/**
 * Generate a batch of test todos
 */
export function generateTodos(count: number = TOTAL_TODOS): Omit<TodoItem, 'id'>[] {
  const todos: Omit<TodoItem, 'id'>[] = [];
  
  for (let i = 0; i < count; i++) {
    const createdAt = getRandomDate(90, 0); // Created in last 90 days
    const status = getRandomElement(statuses);
    const isCompleted = status === TodoStatus.COMPLETED_SUCCESS || status === TodoStatus.COMPLETED_ERROR;
    const isArchived = Math.random() < 0.1; // 10% archived
    
    todos.push({
      title: `Task #${i + 1}: ${getRandomTitle()}`,
      description: generateDescription(i),
      status,
      priority: getRandomElement(priorities),
      assignee: Math.random() > 0.15 ? getRandomElement(assignees) : undefined, // 85% have assignee
      tags: getRandomTags(),
      complianceStandards: getRandomStandards(),
      storyPoints: Math.random() > 0.25 ? Math.floor(Math.random() * 13) + 1 : undefined, // 75% have story points
      dueDate: Math.random() > 0.4 ? getRandomDate(-5, 30) : undefined, // 60% have due date
      plannedDate: Math.random() > 0.6 ? getRandomDate(0, 14) : undefined,
      createdAt,
      updatedAt: getRandomDate(0, 0), // Updated recently
      completedAt: isCompleted ? getRandomDate(0, 0) : undefined,
      archived: isArchived,
      archivedAt: isArchived ? getRandomDate(0, 0) : undefined,
    });
  }
  
  return todos;
}

function generateDescription(index: number): string {
  const descriptions = [
    'This task requires immediate attention due to compliance requirements.',
    'Review and update the existing implementation to meet new security standards.',
    'Perform thorough testing before deployment to production environment.',
    'Coordinate with the security team to validate the changes.',
    'Document all changes and update the relevant wiki pages.',
    'This is a follow-up task from the last security audit.',
    'Ensure backwards compatibility with existing integrations.',
    'Monitor performance metrics after implementation.',
  ];
  
  const base = descriptions[index % descriptions.length];
  return `${base}\n\nAdditional context for task #${index + 1}. Created for performance testing purposes.`;
}

/**
 * Generate todos in batches for bulk insertion
 */
export function generateTodosInBatches(
  total: number = TOTAL_TODOS, 
  batchSize: number = 500
): Array<Omit<TodoItem, 'id'>[]> {
  const batches: Array<Omit<TodoItem, 'id'>[]> = [];
  let remaining = total;
  let offset = 0;
  
  while (remaining > 0) {
    const count = Math.min(batchSize, remaining);
    batches.push(generateTodos(count));
    remaining -= count;
    offset += count;
  }
  
  return batches;
}

export const SEED_CONFIG = {
  TOTAL_TODOS,
  BATCH_SIZE: 500,
};


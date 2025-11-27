/**
 * Tests for Table Helper Functions
 * Run with: yarn test
 */
import { formatId, formatDate, getAssigneeInitials } from './table-helpers';

describe('Table Helpers', () => {
  describe('formatId', () => {
    it('should format a UUID to TODO-XXXX format', () => {
      const id = 'abc123def456';
      expect(formatId(id)).toBe('TODO-ABC1');
    });

    it('should handle short IDs', () => {
      const id = 'ab';
      expect(formatId(id)).toBe('TODO-AB');
    });

    it('should uppercase the ID', () => {
      const id = 'abcd1234';
      expect(formatId(id)).toBe('TODO-ABCD');
    });

    it('should handle empty string', () => {
      expect(formatId('')).toBe('TODO-');
    });
  });

  describe('formatDate', () => {
    it('should format a valid ISO date string', () => {
      const date = '2024-11-27T10:30:00.000Z';
      const result = formatDate(date);
      
      // Check it contains expected parts (locale-independent)
      expect(result).toContain('Nov');
      expect(result).toContain('27');
      expect(result).toContain('2024');
    });

    it('should return dash for undefined date', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatDate('')).toBe('-');
    });

    it('should handle different date formats', () => {
      const date = new Date('2023-06-15T14:45:00').toISOString();
      const result = formatDate(date);
      
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });
  });

  describe('getAssigneeInitials', () => {
    it('should get initials from full name', () => {
      expect(getAssigneeInitials('John Doe')).toBe('JD');
    });

    it('should get single initial from single name', () => {
      expect(getAssigneeInitials('John')).toBe('J');
    });

    it('should limit to 2 characters', () => {
      expect(getAssigneeInitials('John Michael Doe')).toBe('JM');
    });

    it('should return ? for undefined', () => {
      expect(getAssigneeInitials(undefined)).toBe('?');
    });

    it('should return ? for empty string', () => {
      expect(getAssigneeInitials('')).toBe('?');
    });

    it('should uppercase the initials', () => {
      expect(getAssigneeInitials('john doe')).toBe('JD');
    });

    it('should handle names with multiple spaces', () => {
      expect(getAssigneeInitials('John  Doe')).toBe('JD');
    });
  });
});


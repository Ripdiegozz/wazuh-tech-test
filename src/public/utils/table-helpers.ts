// Table Helper Functions
// Shared utilities for table views

/**
 * Format a TODO ID for display
 * @param id - The full UUID
 * @returns Formatted ID like "TODO-ABCD"
 */
export const formatId = (id: string): string => {
  return `TODO-${id.slice(0, 4).toUpperCase()}`;
};

/**
 * Format a date string for table display
 * @param dateString - ISO date string
 * @returns Formatted date like "Nov 27, 2024, 10:30 AM"
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get initials from a name for avatar display
 * @param name - Full name string
 * @returns Up to 2 character initials
 */
export const getAssigneeInitials = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};


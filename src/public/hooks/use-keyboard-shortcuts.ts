import { useEffect, useCallback } from 'react';
import { useTodoStore } from '../stores';

// Search input ID used for focusing
export const SEARCH_INPUT_ID = 'todo-search-input';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

/**
 * Focus the search input by ID
 */
const focusSearchInput = () => {
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (input) {
    input.focus();
  }
};

/**
 * Hook for global keyboard shortcuts
 */
export const useKeyboardShortcuts = () => {
  const { 
    setView, 
    openCreateModal, 
    closeModal, 
    resetFilters,
    isModalOpen,
    currentView,
  } = useTodoStore();

  const shortcuts: ShortcutConfig[] = [
    // Navigation
    {
      key: '1',
      action: () => setView('board'),
      description: 'Switch to Board view',
    },
    {
      key: '2',
      action: () => setView('table'),
      description: 'Switch to Table view',
    },
    {
      key: '3',
      action: () => setView('archived'),
      description: 'Switch to Archived view',
    },
    {
      key: '4',
      action: () => setView('stats'),
      description: 'Switch to Stats view',
    },
    
    // Actions
    {
      key: 'n',
      ctrl: true,
      action: () => openCreateModal(),
      description: 'Create new TODO',
    },
    {
      key: 'c',
      action: () => {
        if (!isModalOpen) openCreateModal();
      },
      description: 'Create new TODO (quick)',
    },
    
    // Search
    {
      key: 'f',
      ctrl: true,
      action: () => focusSearchInput(),
      description: 'Focus search',
    },
    {
      key: '/',
      action: () => {
        if (!isModalOpen) {
          focusSearchInput();
        }
      },
      description: 'Focus search (quick)',
    },
    
    // Reset
    {
      key: 'r',
      alt: true,
      action: () => resetFilters(),
      description: 'Reset all filters',
    },
    
    // Close
    {
      key: 'Escape',
      action: () => {
        if (isModalOpen) {
          closeModal();
        } else {
          // Blur focused element
          (document.activeElement as HTMLElement)?.blur();
        }
      },
      description: 'Close modal / Unfocus',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except Escape)
    const target = event.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    const isContentEditable = target.isContentEditable;
    
    if ((isInput || isContentEditable) && event.key !== 'Escape') {
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, isModalOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    currentView,
  };
};

/**
 * Get formatted shortcut key for display
 */
export const formatShortcut = (shortcut: ShortcutConfig): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  
  // Format special keys
  let key = shortcut.key;
  if (key === 'Escape') key = 'Esc';
  if (key === '/') key = '/';
  
  parts.push(key.toUpperCase());
  
  return parts.join(' + ');
};

/**
 * Keyboard shortcuts help data
 */
export const KEYBOARD_SHORTCUTS_HELP = [
  { category: 'Navigation', shortcuts: [
    { keys: '1', description: 'Board view' },
    { keys: '2', description: 'Table view' },
    { keys: '3', description: 'Archived view' },
    { keys: '4', description: 'Stats view' },
  ]},
  { category: 'Actions', shortcuts: [
    { keys: 'C', description: 'Create new TODO' },
    { keys: 'Ctrl + N', description: 'Create new TODO' },
  ]},
  { category: 'Search', shortcuts: [
    { keys: '/', description: 'Focus search' },
    { keys: 'Ctrl + F', description: 'Focus search' },
  ]},
  { category: 'Other', shortcuts: [
    { keys: 'Alt + R', description: 'Reset filters' },
    { keys: 'Esc', description: 'Close modal / Unfocus' },
  ]},
];


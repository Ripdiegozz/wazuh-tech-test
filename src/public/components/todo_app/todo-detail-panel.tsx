import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSpacer,
  EuiHorizontalRule,
  EuiFieldText,
  EuiSuperSelect,
  EuiComboBox,
  EuiDatePicker,
  EuiToolTip,
  EuiIcon,
  EuiConfirmModal,
} from '@elastic/eui';
import moment from 'moment';
import { TodoItem } from '../../../common/types';
import { DATE_FORMAT } from '../../../common';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  COMPLIANCE_OPTIONS,
  SUGGESTED_TAGS,
} from '../../constants';
import { InlineTextEditor, EditableMarkdown } from './shared';

interface TodoDetailPanelProps {
  todo: TodoItem;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// ============================================
// Main Component
// ============================================
export const TodoDetailPanel: React.FC<TodoDetailPanelProps> = ({
  todo,
  onClose,
  onUpdate,
  onArchive,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(todo.title);

  // Update local state when todo changes
  useEffect(() => {
    setTitleValue(todo.title);
  }, [todo]);

  const handleFieldUpdate = useCallback(async (field: keyof TodoItem, value: any) => {
    await onUpdate(todo.id, { [field]: value });
  }, [todo.id, onUpdate]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete(todo.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      setIsDeleting(false);
    }
  }, [todo.id, onDelete, onClose]);

  const handleArchive = useCallback(async () => {
    await onArchive(todo.id);
    onClose();
  }, [todo.id, onArchive, onClose]);

  // Title handlers
  const handleTitleSave = () => {
    if (titleValue.trim()) {
      handleFieldUpdate('title', titleValue.trim());
    }
    setTitleEditing(false);
  };

  // Tags as ComboBox options
  const tagOptions = (todo.tags || []).map(tag => ({ label: tag }));
  const handleTagsChange = (selectedOptions: Array<{ label: string }>) => {
    handleFieldUpdate('tags', selectedOptions.map(opt => opt.label));
  };

  // Compliance as ComboBox
  const selectedCompliance = (todo.complianceStandards || []).map(std => 
    COMPLIANCE_OPTIONS.find(opt => opt.value === std) || { label: std.toUpperCase(), value: std }
  );
  const handleComplianceChange = (selectedOptions: Array<{ label: string; value: string }>) => {
    handleFieldUpdate('complianceStandards', selectedOptions.map(opt => opt.value));
  };

  // Due date
  const dueDateMoment = todo.dueDate ? moment(todo.dueDate) : null;
  const handleDueDateChange = (date: moment.Moment | null) => {
    handleFieldUpdate('dueDate', date ? date.toISOString() : undefined);
  };

  const formatDate = (dateStr?: string, includeTime = false) => {
    if (!dateStr) return 'None';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <EuiFlyout
      ownFocus
      onClose={onClose}
      size="m"
      aria-labelledby="todoDetailTitle"
      className="todo-detail-panel"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="m">
          <EuiFlexItem>
            {titleEditing ? (
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem>
                  <EuiFieldText
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') {
                        setTitleValue(todo.title);
                        setTitleEditing(false);
                      }
                    }}
                    fullWidth
                    autoFocus
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon iconType="check" color="primary" aria-label="Save" onClick={handleTitleSave} />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon iconType="cross" aria-label="Cancel" onClick={() => { setTitleValue(todo.title); setTitleEditing(false); }} />
                </EuiFlexItem>
              </EuiFlexGroup>
            ) : (
              <EuiTitle size="m">
                <h2 
                  id="todoDetailTitle" 
                  className="todo-detail__title-editable"
                  onClick={() => setTitleEditing(true)}
                >
                  {todo.title}
                  <EuiIcon type="pencil" size="s" className="todo-detail__edit-icon" />
                </h2>
              </EuiTitle>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginRight: 32 }}>
            <EuiFlexGroup gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiToolTip content="Archive">
                  <EuiButtonIcon iconType="folderClosed" aria-label="Archive" onClick={handleArchive} />
                </EuiToolTip>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip content="Delete">
                  <EuiButtonIcon iconType="trash" color="danger" aria-label="Delete" onClick={handleDeleteClick} />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <div className="todo-detail__fields">
          {/* Status - SuperSelect */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Status</EuiText>
            <div className="todo-detail__field-value">
              <EuiSuperSelect
                options={STATUS_OPTIONS}
                valueOfSelected={todo.status}
                onChange={(value) => handleFieldUpdate('status', value)}
                compressed
              />
            </div>
          </div>

          {/* Priority - SuperSelect */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Priority</EuiText>
            <div className="todo-detail__field-value">
              <EuiSuperSelect
                options={PRIORITY_OPTIONS}
                valueOfSelected={todo.priority}
                onChange={(value) => handleFieldUpdate('priority', value)}
                compressed
              />
            </div>
          </div>

          {/* Assignee - Inline Text */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Assignee</EuiText>
            <div className="todo-detail__field-value">
              <InlineTextEditor
                value={todo.assignee || ''}
                onSave={(value) => handleFieldUpdate('assignee', value || undefined)}
                placeholder="Unassigned"
              />
            </div>
          </div>

          {/* Story Points - Inline Number */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Story Points</EuiText>
            <div className="todo-detail__field-value">
              <InlineTextEditor
                value={todo.storyPoints?.toString() || ''}
                onSave={(value) => {
                  const num = parseInt(value, 10);
                  if (value === '' || isNaN(num)) {
                    handleFieldUpdate('storyPoints', undefined);
                  } else if (num >= 0 && num <= 100) {
                    handleFieldUpdate('storyPoints', num);
                  }
                }}
                placeholder="None"
                type="number"
              />
            </div>
          </div>

          {/* Due Date - DatePicker */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Due Date</EuiText>
            <div className="todo-detail__field-value">
              <EuiDatePicker
                selected={dueDateMoment}
                onChange={handleDueDateChange}
                dateFormat={DATE_FORMAT}
                placeholder="Select date..."
                className="todo-detail__date-picker"
              />
            </div>
          </div>

          {/* Tags - ComboBox */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Tags</EuiText>
            <div className="todo-detail__field-value">
              <EuiComboBox
                placeholder="Add tags..."
                options={SUGGESTED_TAGS}
                selectedOptions={tagOptions}
                onChange={handleTagsChange}
                onCreateOption={(searchValue) => {
                  const newTag = searchValue.trim().toLowerCase();
                  if (newTag) {
                    handleFieldUpdate('tags', [...(todo.tags || []), newTag]);
                  }
                }}
                compressed
                isClearable={false}
              />
            </div>
          </div>

          {/* Compliance - ComboBox/MultiSelect */}
          <div className="todo-detail__field-row">
            <EuiText size="xs" color="subdued" className="todo-detail__field-label">Compliance</EuiText>
            <div className="todo-detail__field-value">
              <EuiComboBox
                placeholder="Select standards..."
                options={COMPLIANCE_OPTIONS}
                selectedOptions={selectedCompliance}
                onChange={handleComplianceChange}
                compressed
                isClearable
              />
            </div>
          </div>
        </div>

        <EuiSpacer size="l" />

        {/* Description - Markdown Editor */}
        <EuiTitle size="xs">
          <h3>Description</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        
        <EditableMarkdown
          value={todo.description || ''}
          onSave={(value) => handleFieldUpdate('description', value || undefined)}
          emptyText="Click to add description..."
          className="todo-detail__description"
        />

        <EuiHorizontalRule />

        {/* Metadata - Read only */}
        <EuiText size="xs" color="subdued">
          <p><strong>Created:</strong> {formatDate(todo.createdAt, true)}</p>
          <p><strong>Updated:</strong> {formatDate(todo.updatedAt, true)}</p>
          {todo.completedAt && <p><strong>Completed:</strong> {formatDate(todo.completedAt, true)}</p>}
          {todo.id && <p><strong>ID:</strong> <code>{todo.id}</code></p>}
        </EuiText>
      </EuiFlyoutBody>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <EuiConfirmModal
          title="Delete this task?"
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          cancelButtonText="Cancel"
          confirmButtonText={isDeleting ? 'Deleting...' : 'Delete'}
          buttonColor="danger"
          confirmButtonDisabled={isDeleting}
          isLoading={isDeleting}
        >
          <p>
            Are you sure you want to delete <strong>"{todo.title}"</strong>? This action cannot be undone.
          </p>
        </EuiConfirmModal>
      )}
    </EuiFlyout>
  );
};


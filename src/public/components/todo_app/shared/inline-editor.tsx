import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiFieldNumber,
  EuiButtonIcon,
  EuiIcon,
} from '@elastic/eui';

// Inline Text Editor
// Click-to-edit text/number field

interface InlineTextEditorProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  className?: string;
}

// Inline editable text field
// Click-to-edit text/number field
export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onSave,
  placeholder = 'None',
  type = 'text',
  min = 0,
  max,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        <EuiFlexItem>
          {type === 'number' ? (
            <EuiFieldNumber
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              compressed
              autoFocus
              min={min}
              max={max}
              style={{ width: '80px' }}
            />
          ) : (
            <EuiFieldText
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              compressed
              autoFocus
              placeholder={placeholder}
            />
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="check"
            color="primary"
            aria-label="Save"
            onClick={handleSave}
            size="s"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="cross"
            color="text"
            aria-label="Cancel"
            onClick={handleCancel}
            size="s"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <div
      className={`inline-editor ${className}`}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
    >
      {value || <span className="inline-editor__placeholder">{placeholder}</span>}
      <EuiIcon type="pencil" size="s" className="inline-editor__edit-icon" />
    </div>
  );
};

// Inline Title Editor
// Larger version for titles
interface InlineTitleEditorProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Inline editable title field
// Similar to InlineTextEditor but styled for titles
export const InlineTitleEditor: React.FC<InlineTitleEditorProps> = ({
  value,
  onSave,
  placeholder = 'Enter title...',
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue.trim()) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
        <EuiFlexItem>
          <EuiFieldText
            value={editValue}
            placeholder={placeholder}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            fullWidth
            autoFocus
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="check"
            color="primary"
            aria-label="Save"
            onClick={handleSave}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="cross"
            aria-label="Cancel"
            onClick={handleCancel}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <div
      className={`inline-title-editor ${className}`}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
    >
      {value}
      <EuiIcon type="pencil" size="s" className="inline-title-editor__edit-icon" />
    </div>
  );
};


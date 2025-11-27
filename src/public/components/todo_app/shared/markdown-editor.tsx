import * as React from 'react';
import {
  EuiMarkdownEditor,
  EuiMarkdownFormat,
  EuiText,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSpacer,
} from '@elastic/eui';

// Markdown Editor Component
// Standalone markdown editor for forms
interface MarkdownFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  height?: number;
  ariaLabel?: string;
  readOnly?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownFieldProps> = ({
  value,
  onChange,
  placeholder = 'Add content... (supports markdown)',
  height = 200,
  ariaLabel = 'Markdown editor',
}) => {
  return (
    <EuiMarkdownEditor
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      height={height}
      initialViewMode="editing"
    />
  );
};

// Markdown Display Component
// For rendering markdown content
interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={className}>
      <EuiMarkdownFormat>
        {content}
      </EuiMarkdownFormat>
    </div>
  );
};

// Editable Markdown Field
// Click-to-edit markdown field with view/edit toggle
interface EditableMarkdownProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  height?: number;
  emptyText?: string;
  className?: string;
}

export const EditableMarkdown: React.FC<EditableMarkdownProps> = ({
  value,
  onSave,
  placeholder = 'Add content...',
  height = 200,
  emptyText = 'Click to add content...',
  className = '',
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);

  React.useEffect(() => {
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

  if (isEditing) {
    return (
      <>
        <EuiMarkdownEditor
          aria-label="Edit content"
          placeholder={placeholder}
          value={editValue}
          onChange={setEditValue}
          height={height}
          initialViewMode="editing"
        />
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" justifyContent="flexEnd" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="cross"
              aria-label="Cancel"
              onClick={handleCancel}
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
        </EuiFlexGroup>
      </>
    );
  }

  return (
    <div
      className={`editable-markdown ${className}`}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
    >
      {value ? (
        <div className="editable-markdown__content">
          <EuiMarkdownFormat>
            {value}
          </EuiMarkdownFormat>
        </div>
      ) : (
        <EuiText size="s" color="subdued">
          <p><em>{emptyText}</em></p>
        </EuiText>
      )}
      <EuiIcon type="pencil" size="s" className="editable-markdown__edit-icon" />
    </div>
  );
};


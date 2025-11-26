import React, { useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiTextArea,
  EuiSuperSelect,
  EuiComboBox,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiDatePicker,
} from '@elastic/eui';
import { Moment } from 'moment';
import { 
  TodoPriority, 
  ComplianceStandard,
  CreateTodoRequest,
} from '../../../common/types';
import { DATE_FORMAT } from '../../../common';
import {
  PRIORITY_OPTIONS,
  COMPLIANCE_OPTIONS,
  SUGGESTED_TAGS,
} from '../../constants';

interface TodoModalProps {
  onSave: (data: CreateTodoRequest) => void;
  onClose: () => void;
}

export const TodoModal: React.FC<TodoModalProps> = ({
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>(TodoPriority.MEDIUM);
  const [assignee, setAssignee] = useState('');
  const [storyPoints, setStoryPoints] = useState<number | undefined>();
  const [dueDate, setDueDate] = useState<Moment | null>(null);
  const [tags, setTags] = useState<Array<{ label: string }>>([]);
  const [complianceStandards, setComplianceStandards] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const data: CreateTodoRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignee: assignee.trim() || undefined,
        storyPoints: storyPoints || undefined,
        dueDate: dueDate?.toISOString() || undefined,
        tags: tags.map((t) => t.label),
        complianceStandards: complianceStandards.map((cs) => cs.value) as ComplianceStandard[],
      };

      await onSave(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagCreate = (searchValue: string) => {
    const normalizedTag = searchValue.toLowerCase().trim();
    if (!normalizedTag) return;
    
    const newTag = { label: normalizedTag };
    setTags([...tags, newTag]);
  };

  return (
    <EuiModal onClose={onClose} maxWidth={600}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Create Work Item</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiForm component="form">
          {/* Title */}
          <EuiFormRow label="Title" isInvalid={!title.trim()} error="Title is required">
            <EuiFieldText
              placeholder="Enter a title for this work item"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              isInvalid={!title.trim()}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          {/* Description */}
          <EuiFormRow label="Description" fullWidth>
            <EuiTextArea
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              fullWidth
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          {/* Priority */}
          <EuiFormRow label="Priority">
            <EuiSuperSelect
              options={PRIORITY_OPTIONS}
              valueOfSelected={priority}
              onChange={(value) => setPriority(value as TodoPriority)}
              fullWidth
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          {/* Assignee & Story Points */}
          <EuiFlexGroup gutterSize="m">
            <EuiFlexItem>
              <EuiFormRow label="Assignee">
                <EuiFieldText
                  placeholder="Enter assignee name"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  fullWidth
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 120 }}>
              <EuiFormRow label="Story Points">
                <EuiFieldNumber
                  placeholder="0"
                  value={storyPoints ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (e.target.value === '' || e.target.value === undefined) {
                      setStoryPoints(undefined);
                    } else if (!isNaN(val) && val >= 0 && val <= 100) {
                      setStoryPoints(val);
                    }
                  }}
                  min={0}
                  max={100}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="m" />

          {/* Due Date */}
          <EuiFormRow label="Due Date">
            <EuiDatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              placeholder="Select due date"
              showTimeSelect={false}
              dateFormat={DATE_FORMAT}
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          {/* Tags */}
          <EuiFormRow label="Tags" helpText="Press Enter to create a new tag">
            <EuiComboBox
              placeholder="Add tags"
              options={SUGGESTED_TAGS}
              selectedOptions={tags}
              onChange={(selected) => setTags(selected)}
              onCreateOption={handleTagCreate}
              isClearable
            />
          </EuiFormRow>

          <EuiSpacer size="m" />

          {/* Compliance */}
          <EuiFormRow label="Compliance Standards">
            <EuiComboBox
              placeholder="Select compliance standards"
              options={COMPLIANCE_OPTIONS}
              selectedOptions={complianceStandards}
              onChange={(selected) => setComplianceStandards(selected as any)}
              isClearable
            />
          </EuiFormRow>
        </EuiForm>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton
          fill
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={!title.trim()}
        >
          Create
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};


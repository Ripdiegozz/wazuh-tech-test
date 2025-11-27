import * as React from 'react';
import {
  EuiTourStep,
  EuiText,
  EuiButton,
  EuiButtonEmpty,
  EuiSpacer,
  useEuiTour,
  EuiTourStepProps,
} from '@elastic/eui';

// Tour step configurations
const tourStepsConfig = [
  {
    step: 1,
    title: 'Welcome to Security TODO Manager! 👋',
    content: (
      <EuiText size="s">
        <p>
          This tool helps you track and manage your security compliance tasks.
          Let's take a quick tour to get you started!
        </p>
      </EuiText>
    ),
    anchorPosition: 'downCenter' as const,
  },
  {
    step: 2,
    title: 'Create Tasks',
    content: (
      <EuiText size="s">
        <p>
          Click the <strong>"+ Create"</strong> button to create a new task.
          Add priority, assignee, due date, and compliance standards.
        </p>
      </EuiText>
    ),
    anchorPosition: 'downCenter' as const,
  },
  {
    step: 3,
    title: 'Switch Views',
    content: (
      <EuiText size="s">
        <p>
          Toggle between <strong>Board</strong>, <strong>Table</strong>,{' '}
          <strong>Archived</strong>, and <strong>Stats</strong> views.
        </p>
        <p>
          <em>Pro tip: Press <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, or <strong>4</strong> to switch views quickly! 
          Check the <strong>⌨️</strong> button for all shortcuts.</em>
        </p>
      </EuiText>
    ),
    anchorPosition: 'downCenter' as const,
  },
  {
    step: 4,
    title: 'Search & Filter',
    content: (
      <EuiText size="s">
        <p>
          Search by title or description. Filter by priority and status.
        </p>
        <p>
          <em>Pro tip: Press <strong>/</strong> to focus the search bar!</em>
        </p>
      </EuiText>
    ),
    anchorPosition: 'downCenter' as const,
  },
  {
    step: 5,
    title: "You're all set! 🎉",
    content: (
      <EuiText size="s">
        <p>
          <strong>Drag and drop</strong> tasks between columns to update status.
          Click any task to view details and edit.
        </p>
      </EuiText>
    ),
    anchorPosition: 'rightUp' as const,
  },
];

const tourConfig = {
  currentTourStep: 1,
  isTourActive: true,
  tourPopoverWidth: 300,
  tourSubtitle: 'Quick Tour',
};

// Local storage key
const TOUR_STORAGE_KEY = 'wazuh_todo_tour_completed';

// Check if tour was completed
const isTourCompleted = (): boolean => {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

// Mark tour as completed
const markTourCompleted = () => {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  } catch {
    // Ignore
  }
};

// Reset tour
const resetTourStorage = () => {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch {
    // Ignore
  }
};

// Hook to use the tour
export const useTodoTour = () => {
  const [shouldShowTour, setShouldShowTour] = React.useState(!isTourCompleted());
  
  const [[step1, step2, step3, step4, step5], actions, state] = useEuiTour(
    tourStepsConfig,
    {
      ...tourConfig,
      isTourActive: shouldShowTour,
    }
  );

  const finishTour = React.useCallback(() => {
    markTourCompleted();
    actions.finishTour();
    setShouldShowTour(false);
  }, [actions]);

  const resetTour = React.useCallback(() => {
    resetTourStorage();
    setShouldShowTour(true);
    actions.resetTour();
  }, [actions]);

  return {
    tourSteps: { step1, step2, step3, step4, step5 },
    actions: { ...actions, finishTour, resetTour },
    state,
    isTourActive: state.isTourActive && shouldShowTour,
  };
};

// Tour Step Wrapper Components
interface TourStepWrapperProps {
  tourStep: Partial<EuiTourStepProps>;
  children: React.ReactNode;
  onNext?: () => void;
  onFinish?: () => void;
  isLast?: boolean;
}

export const TourStepWrapper: React.FC<TourStepWrapperProps> = ({
  tourStep,
  children,
  onNext,
  onFinish,
  isLast = false,
}) => {
  const footerAction = isLast ? (
    <EuiButton size="s" color="primary" onClick={onFinish}>
      Get Started!
    </EuiButton>
  ) : (
    <EuiButton size="s" color="primary" onClick={onNext}>
      Next
    </EuiButton>
  );

  return (
    <EuiTourStep
      {...tourStep}
      footerAction={footerAction}
    >
      {children}
    </EuiTourStep>
  );
};

import * as React from "react";
import {
  EuiIcon,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPopover,
  EuiButtonIcon,
  EuiToolTip,
  EuiButton,
  EuiTourStep,
} from "@elastic/eui";
import { KEYBOARD_SHORTCUTS_HELP } from "../../hooks";
import { formatBadgeCount } from "./shared/constants";

type ViewType = "board" | "table" | "archived" | "stats";

interface TodoNavTabsProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  archivedCount: number;
  tourSteps: {
    step1: any;
    step3: any;
  };
  tourActions: {
    goToStep: (step: number) => void;
    resetTour: () => void;
  };
}

export const TodoNavTabs: React.FC<TodoNavTabsProps> = ({
  currentView,
  onViewChange,
  archivedCount,
  tourSteps,
  tourActions,
}) => {
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  return (
    <>
      {/* Header */}
      <EuiTourStep
        {...tourSteps.step1}
        footerAction={
          <EuiButton
            size="s"
            color="primary"
            onClick={() => tourActions.goToStep(2)}
          >
            Next
          </EuiButton>
        }
      >
        <header className="todo-app__header">
          <h1>
            <EuiIcon type="listAdd" size="l" />
            Security TODO Manager
          </h1>
        </header>
      </EuiTourStep>

      {/* Navigation Tabs */}
      <EuiTourStep
        {...tourSteps.step3}
        footerAction={
          <EuiButton
            size="s"
            color="primary"
            onClick={() => tourActions.goToStep(4)}
          >
            Next
          </EuiButton>
        }
      >
        <nav className="todo-app__nav">
          <button
            className={`todo-app__nav-tab ${
              currentView === "board" ? "todo-app__nav-tab--active" : ""
            }`}
            onClick={() => onViewChange("board")}
          >
            <EuiIcon type="visMapRegion" />
            Board
            <EuiText size="xs" color="subdued">
              [1]
            </EuiText>
          </button>
          <button
            className={`todo-app__nav-tab ${
              currentView === "table" ? "todo-app__nav-tab--active" : ""
            }`}
            onClick={() => onViewChange("table")}
          >
            <EuiIcon type="visTable" />
            All Work
            <EuiText size="xs" color="subdued">
              [2]
            </EuiText>
          </button>
          <button
            className={`todo-app__nav-tab ${
              currentView === "archived" ? "todo-app__nav-tab--active" : ""
            }`}
            onClick={() => onViewChange("archived")}
          >
            <EuiIcon type="folderClosed" />
            Archived
            <EuiText size="xs" color="subdued">
              [3]
            </EuiText>
            {archivedCount > 0 && (
              <span className="todo-app__nav-badge">
                {formatBadgeCount(archivedCount)}
              </span>
            )}
          </button>
          <button
            className={`todo-app__nav-tab ${
              currentView === "stats" ? "todo-app__nav-tab--active" : ""
            }`}
            onClick={() => onViewChange("stats")}
          >
            <EuiIcon type="visBarVerticalStacked" />
            Stats
            <EuiText size="xs" color="subdued">
              [4]
            </EuiText>
          </button>
          <EuiPopover
            button={
              <EuiToolTip content="Keyboard shortcuts">
                <EuiButtonIcon
                  iconType="keyboardShortcut"
                  aria-label="Keyboard shortcuts"
                  onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
                />
              </EuiToolTip>
            }
            isOpen={isShortcutsOpen}
            closePopover={() => setIsShortcutsOpen(false)}
            anchorPosition="downRight"
          >
            <div style={{ width: 280 }}>
              <EuiText size="s">
                <h4>Keyboard Shortcuts</h4>
              </EuiText>
              <EuiSpacer size="s" />
              {KEYBOARD_SHORTCUTS_HELP.map((group) => (
                <div key={group.category}>
                  <EuiText size="xs" color="subdued">
                    <strong>{group.category}</strong>
                  </EuiText>
                  {group.shortcuts.map((s) => (
                    <EuiFlexGroup
                      key={s.keys}
                      justifyContent="spaceBetween"
                      alignItems="center"
                      gutterSize="s"
                    >
                      <EuiFlexItem>
                        <EuiText size="xs">{s.description}</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <code>{s.keys}</code>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  ))}
                  <EuiSpacer size="xs" />
                </div>
              ))}
              <EuiSpacer size="m" />
              <EuiLink
                onClick={() => {
                  tourActions.resetTour();
                  setIsShortcutsOpen(false);
                }}
              >
                <EuiIcon type="training" size="s" /> Restart app tour
              </EuiLink>
            </div>
          </EuiPopover>
        </nav>
      </EuiTourStep>
    </>
  );
};


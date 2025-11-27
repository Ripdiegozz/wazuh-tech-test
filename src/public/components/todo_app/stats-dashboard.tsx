import * as React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiStat,
  EuiIcon,
  EuiProgress,
  EuiText,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiToolTip,
} from '@elastic/eui';
import { TodoStatistics, TodoStatus, TodoPriority, ComplianceStandard } from '../../../common/types';

interface StatsDashboardProps {
  statistics: TodoStatistics | undefined;
  isLoading: boolean;
}

// EUI color types for progress bars and visual elements
type EuiColorType = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'subdued';

// Status colors using EUI semantic colors (CSS variables for charts, names for components)
const STATUS_CONFIG: Record<TodoStatus, { color: string; euiColor: EuiColorType; label: string }> = {
  [TodoStatus.PLANNED]: { color: 'var(--euiColorMediumShade)', euiColor: 'subdued', label: 'To Do' },
  [TodoStatus.IN_PROGRESS]: { color: 'var(--euiColorPrimary)', euiColor: 'primary', label: 'In Progress' },
  [TodoStatus.BLOCKED]: { color: 'var(--euiColorDanger)', euiColor: 'danger', label: 'Blocked' },
  [TodoStatus.COMPLETED_SUCCESS]: { color: 'var(--euiColorSuccess)', euiColor: 'success', label: 'Done' },
  [TodoStatus.COMPLETED_ERROR]: { color: 'var(--euiColorWarning)', euiColor: 'warning', label: 'Error' },
};

// Priority colors using EUI semantic colors
const PRIORITY_CONFIG: Record<TodoPriority, { color: string; euiColor: EuiColorType; label: string }> = {
  [TodoPriority.LOW]: { color: 'var(--euiColorMediumShade)', euiColor: 'subdued', label: 'Low' },
  [TodoPriority.MEDIUM]: { color: 'var(--euiColorPrimary)', euiColor: 'primary', label: 'Medium' },
  [TodoPriority.HIGH]: { color: 'var(--euiColorWarning)', euiColor: 'warning', label: 'High' },
  [TodoPriority.CRITICAL]: { color: 'var(--euiColorDanger)', euiColor: 'danger', label: 'Critical' },
};

// Compliance standard labels
const COMPLIANCE_LABELS: Record<ComplianceStandard, string> = {
  [ComplianceStandard.PCI_DSS]: 'PCI DSS',
  [ComplianceStandard.ISO_27001]: 'ISO 27001',
  [ComplianceStandard.SOX]: 'SOX',
  [ComplianceStandard.HIPAA]: 'HIPAA',
  [ComplianceStandard.GDPR]: 'GDPR',
  [ComplianceStandard.NIST]: 'NIST',
};

// Format time duration
const formatDuration = (hours: number): string => {
  if (hours < 1) return '< 1 hour';
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
};

// Progress Bar Component
const StatProgressBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string; // CSS variable for label
  euiColor: EuiColorType; // EUI color name for progress bar
}> = ({ label, value, max, color, euiColor }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="stats-progress-item">
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiText size="xs">
            <span style={{ color }}>{label}</span>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {value}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiProgress
        value={percentage}
        max={100}
        size="s"
        color={euiColor}
      />
    </div>
  );
};

// Donut Chart Component (CSS-based)
const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}> = ({ data, total, centerLabel }) => {
  // Calculate segments
  let cumulativePercentage = 0;
  const segments = data
    .filter(d => d.value > 0)
    .map(d => {
      const percentage = total > 0 ? (d.value / total) * 100 : 0;
      const segment = {
        ...d,
        percentage,
        startPercentage: cumulativePercentage,
      };
      cumulativePercentage += percentage;
      return segment;
    });

  // Generate conic-gradient using EUI CSS variables
  const gradientParts = segments.map((seg) => {
    const start = seg.startPercentage;
    const end = start + seg.percentage;
    return `${seg.color} ${start}% ${end}%`;
  });
  
  // Use EUI's light shade for empty state
  const gradient = gradientParts.length > 0 
    ? `conic-gradient(${gradientParts.join(', ')})`
    : 'conic-gradient(var(--euiColorLightShade) 0% 100%)';

  return (
    <div className="donut-chart-container">
      <div 
        className="donut-chart"
        style={{ background: gradient }}
      >
        <div className="donut-chart__inner">
          <span className="donut-chart__value">{total}</span>
          <span className="donut-chart__label">{centerLabel}</span>
        </div>
      </div>
      <div className="donut-chart__legend">
        {data.map((item) => (
          <EuiToolTip key={item.label} content={`${item.value} items`}>
            <div className="donut-chart__legend-item">
              <span 
                className="donut-chart__legend-dot"
                style={{ backgroundColor: item.color }}
              />
              <EuiText size="xs">{item.label}</EuiText>
            </div>
          </EuiToolTip>
        ))}
      </div>
    </div>
  );
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  statistics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: 400 }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (!statistics) {
    return (
      <EuiPanel className="stats-empty">
        <EuiText textAlign="center" color="subdued">
          <EuiIcon type="visBarVertical" size="xxl" />
          <h3>No statistics available</h3>
          <p>Create some TODOs to see your statistics</p>
        </EuiText>
      </EuiPanel>
    );
  }

  const {
    totalCount,
    byStatus,
    byPriority,
    byComplianceStandard,
    completionRate,
    averageCompletionTime,
    overdueCount,
  } = statistics;

  // Prepare chart data (using CSS variable colors for donut charts)
  const statusData = Object.entries(STATUS_CONFIG).map(([status, config]) => ({
    label: config.label,
    value: byStatus[status as TodoStatus] || 0,
    color: config.color,
  }));

  const priorityData = Object.entries(PRIORITY_CONFIG).map(([priority, config]) => ({
    label: config.label,
    value: byPriority[priority as TodoPriority] || 0,
    color: config.color,
  }));

  // Calculate derived stats
  const completedCount = (byStatus[TodoStatus.COMPLETED_SUCCESS] || 0) + (byStatus[TodoStatus.COMPLETED_ERROR] || 0);
  const inProgressCount = byStatus[TodoStatus.IN_PROGRESS] || 0;
  const blockedCount = byStatus[TodoStatus.BLOCKED] || 0;

  return (
    <div className="stats-dashboard">
      {/* Key Metrics Row */}
      <EuiFlexGroup gutterSize="l" className="stats-metrics">
        <EuiFlexItem>
          <EuiPanel className="stats-card stats-card--total">
            <EuiStat
              title={totalCount}
              description="Total Tasks"
              titleColor="default"
              textAlign="center"
            >
              <EuiIcon type="list" color="primary" />
            </EuiStat>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel className="stats-card stats-card--completion">
            <EuiStat
              title={`${Math.round(completionRate)}%`}
              description="Completion Rate"
              titleColor="success"
              textAlign="center"
            >
              <EuiIcon type="check" color="success" />
            </EuiStat>
            <EuiProgress
              value={completionRate}
              max={100}
              size="s"
              color="success"
              className="stats-card__progress"
            />
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel className="stats-card stats-card--overdue">
            <EuiStat
              title={overdueCount}
              description="Overdue Tasks"
              titleColor={overdueCount > 0 ? 'danger' : 'default'}
              textAlign="center"
            >
              <EuiIcon type="clock" color={overdueCount > 0 ? 'danger' : 'subdued'} />
            </EuiStat>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel className="stats-card stats-card--time">
            <EuiStat
              title={formatDuration(averageCompletionTime)}
              description="Avg. Completion Time"
              titleColor="default"
              textAlign="center"
            >
              <EuiIcon type="visTimelion" color="accent" />
            </EuiStat>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Charts Row */}
      <EuiFlexGroup gutterSize="l">
        {/* Status Distribution */}
        <EuiFlexItem>
          <EuiPanel className="stats-chart-panel">
            <EuiText>
              <h3>
                <EuiIcon type="visBarVertical" /> Tasks by Status
              </h3>
            </EuiText>
            <EuiSpacer size="m" />
            <DonutChart
              data={statusData}
              total={totalCount}
              centerLabel="Tasks"
            />
          </EuiPanel>
        </EuiFlexItem>

        {/* Priority Distribution */}
        <EuiFlexItem>
          <EuiPanel className="stats-chart-panel">
            <EuiText>
              <h3>
                <EuiIcon type="flag" /> Tasks by Priority
              </h3>
            </EuiText>
            <EuiSpacer size="m" />
            <DonutChart
              data={priorityData}
              total={totalCount}
              centerLabel="Tasks"
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Status Progress Bars */}
      <EuiFlexGroup gutterSize="l">
        <EuiFlexItem>
          <EuiPanel className="stats-progress-panel">
            <EuiText>
              <h3>
                <EuiIcon type="visGoal" /> Status Breakdown
              </h3>
            </EuiText>
            <EuiSpacer size="m" />
            <div className="stats-progress-list">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <StatProgressBar
                  key={status}
                  label={config.label}
                  value={byStatus[status as TodoStatus] || 0}
                  max={totalCount}
                  color={config.color}
                  euiColor={config.euiColor}
                />
              ))}
            </div>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiPanel className="stats-progress-panel">
            <EuiText>
              <h3>
                <EuiIcon type="visAreaStacked" /> Priority Breakdown
              </h3>
            </EuiText>
            <EuiSpacer size="m" />
            <div className="stats-progress-list">
              {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                <StatProgressBar
                  key={priority}
                  label={config.label}
                  value={byPriority[priority as TodoPriority] || 0}
                  max={totalCount}
                  color={config.color}
                  euiColor={config.euiColor}
                />
              ))}
            </div>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      {/* Compliance Standards */}
      <EuiPanel className="stats-compliance-panel">
        <EuiText>
          <h3>
            <EuiIcon type="securityApp" /> Compliance Standards Coverage
          </h3>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiFlexGroup wrap gutterSize="m">
          {Object.entries(COMPLIANCE_LABELS).map(([standard, label]) => {
            const count = byComplianceStandard[standard as ComplianceStandard] || 0;
            return (
              <EuiFlexItem key={standard} grow={false}>
                <EuiPanel 
                  className={`stats-compliance-badge ${count > 0 ? 'stats-compliance-badge--active' : ''}`}
                  paddingSize="s"
                >
                  <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiIcon 
                        type="checkInCircleFilled" 
                        color={count > 0 ? 'success' : 'subdued'} 
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s">
                        <strong>{label}</strong>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <span className="stats-compliance-count">{count}</span>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="l" />

      {/* Quick Stats Summary */}
      <EuiPanel className="stats-summary-panel">
        <EuiFlexGroup alignItems="center" gutterSize="l">
          <EuiFlexItem grow={false}>
            <EuiIcon type="iInCircle" size="l" color="primary" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <p>
                You have <strong>{inProgressCount}</strong> tasks in progress
                {blockedCount > 0 && (
                  <>, <strong style={{ color: 'var(--euiColorDanger)' }}>{blockedCount}</strong> blocked</>
                )}
                {overdueCount > 0 && (
                  <>, and <strong style={{ color: 'var(--euiColorDanger)' }}>{overdueCount}</strong> overdue</>
                )}.
                {completedCount > 0 && (
                  <> You've completed <strong style={{ color: 'var(--euiColorSuccess)' }}>{completedCount}</strong> tasks so far!</>
                )}
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
};


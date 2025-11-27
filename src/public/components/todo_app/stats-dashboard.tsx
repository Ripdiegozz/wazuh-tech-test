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
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import euiTheme from '@elastic/eui/dist/oui_theme_light.json';
import { TodoStatistics, TodoStatus, TodoPriority, ComplianceStandard } from '../../../common/types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface StatsDashboardProps {
  statistics: TodoStatistics | undefined;
  isLoading: boolean;
}

// EUI color types for progress bars and visual elements
type EuiColorType = 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'subdued';

// EUI colors from theme - these are the same colors used by EuiBadge
const EUI_COLORS = {
  primary: euiTheme.euiColorPrimary,       // Blue
  success: euiTheme.euiColorSuccess,       // Green
  warning: euiTheme.euiColorWarning,       // Orange
  danger: euiTheme.euiColorDanger,         // Red
  accent: euiTheme.euiColorAccent,         // Pink
  subdued: euiTheme.euiColorMediumShade,   // Gray
  hollow: euiTheme.euiColorLightShade,     // Light gray
  default: euiTheme.euiColorMediumShade,   // Default gray
  mediumShade: euiTheme.euiColorMediumShade, // Medium gray
};

// Status colors - using hex for charts, EUI color names for components
const STATUS_CONFIG: Record<TodoStatus, { color: string; euiColor: EuiColorType; label: string }> = {
  [TodoStatus.PLANNED]: { color: EUI_COLORS.mediumShade, euiColor: 'subdued', label: 'To Do' },
  [TodoStatus.IN_PROGRESS]: { color: EUI_COLORS.primary, euiColor: 'primary', label: 'In Progress' },
  [TodoStatus.BLOCKED]: { color: EUI_COLORS.danger, euiColor: 'danger', label: 'Blocked' },
  [TodoStatus.COMPLETED_SUCCESS]: { color: EUI_COLORS.success, euiColor: 'success', label: 'Done' },
  [TodoStatus.COMPLETED_ERROR]: { color: EUI_COLORS.warning, euiColor: 'warning', label: 'Error' },
};

// Priority colors - matching the colors used in PRIORITY_OPTIONS dropdown (todo-options.ts)
// Low: hollow, Medium: primary, High: warning, Critical: danger
const PRIORITY_CONFIG: Record<TodoPriority, { color: string; euiColor: EuiColorType; label: string }> = {
  [TodoPriority.LOW]: { color: EUI_COLORS.hollow, euiColor: 'subdued', label: 'Low' },
  [TodoPriority.MEDIUM]: { color: EUI_COLORS.primary, euiColor: 'primary', label: 'Medium' },
  [TodoPriority.HIGH]: { color: EUI_COLORS.warning, euiColor: 'warning', label: 'High' },
  [TodoPriority.CRITICAL]: { color: EUI_COLORS.danger, euiColor: 'danger', label: 'Critical' },
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

// Chart data interface
interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

// Bar Chart Component using Chart.js
const StatsBarChart: React.FC<{
  data: ChartDataItem[];
  id: string;
}> = ({ data, id }) => {
  // Filter out zero values
  const filteredData = data.filter(d => d.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="bar-chart-container">
        <div className="bar-chart-empty">
          <EuiText size="s" color="subdued">No data</EuiText>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: filteredData.map(d => d.label),
    datasets: [
      {
        data: filteredData.map(d => d.value),
        backgroundColor: filteredData.map(d => d.color),
        borderColor: filteredData.map(d => d.color),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y} tasks`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="bar-chart-container" style={{ height: 200 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Pie Chart Component using Chart.js
const StatsPieChart: React.FC<{
  data: ChartDataItem[];
  id: string;
}> = ({ data, id }) => {
  // Filter out zero values
  const filteredData = data.filter(d => d.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="pie-chart-container">
        <div className="pie-chart-empty">
          <EuiText size="s" color="subdued">No data</EuiText>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: filteredData.map(d => d.label),
    datasets: [
      {
        data: filteredData.map(d => d.value),
        backgroundColor: filteredData.map(d => d.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="pie-chart-container" style={{ height: 220 }}>
      <Pie data={chartData} options={options} />
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
            <StatsPieChart
              id="status-chart"
              data={statusData}
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
            <StatsBarChart
              id="priority-chart"
              data={priorityData}
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
                  <>, <strong style={{ color: EUI_COLORS.danger }}>{blockedCount}</strong> blocked</>
                )}
                {overdueCount > 0 && (
                  <>, and <strong style={{ color: EUI_COLORS.danger }}>{overdueCount}</strong> overdue</>
                )}.
                {completedCount > 0 && (
                  <> You've completed <strong style={{ color: EUI_COLORS.success }}>{completedCount}</strong> tasks so far!</>
                )}
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
};


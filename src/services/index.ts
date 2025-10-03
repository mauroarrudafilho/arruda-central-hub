// Module Services
export {
  fetchModules,
  fetchModuleById,
  fetchModulesByProject,
  fetchModulesByStatus,
  fetchModuleStats,
  fetchProjects,
  fetchProjectById,
  type ModuleWithProject,
  type ModuleStats,
} from './moduleService';

// Activity Services
export {
  fetchRecentActivities,
  fetchActiveSessions,
  fetchResourceAccessHistory,
  fetchActivityStats,
  logResourceAccess,
  type ActivityWithModule,
  type SessionWithModule,
  type RecentActivity,
} from './activityService';

// Metrics Services
export {
  fetchSystemMetrics,
  fetchModuleUsageStats,
  fetchUserActivityStats,
  fetchDashboardKPIs,
  fetchPerformanceMetrics,
  type SystemMetrics,
  type ModuleUsageStats,
  type UserActivityStats,
  type DashboardKPIs,
} from './metricsService';

// Persistence Services
export {
  logModuleAccess,
  updateUserPreferences,
  getUserPreferences,
  saveModuleProgress,
  getModuleProgress,
  updateSystemMetrics,
  syncOfflineData,
  storeOfflineData,
  type UserPreferences,
  type ModuleProgress,
} from './persistenceService';

// Re-export all Supabase-related hooks for easy importing
export {
  useModules,
  useModule,
  useModuleStats,
  type UseModulesOptions,
  type UseModulesReturn,
} from './useModules';

export {
  useActivities,
  useActiveSessions,
  useResourceAccessHistory,
  useActivityStats,
  useResourceAccessLogger,
  type UseActivitiesOptions,
  type UseActivitiesReturn,
} from './useActivities';

export {
  useSystemMetrics,
  useModuleUsageStats,
  useUserActivityStats,
  useDashboardKPIs,
  usePerformanceMetrics,
  useDashboardData,
} from './useMetrics';

export {
  usePersistence,
} from './usePersistence';

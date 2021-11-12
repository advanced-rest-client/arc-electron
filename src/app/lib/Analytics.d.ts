import { UniversalAnalytics } from './UniversalAnalytics';

export declare interface AnalyticsInit {
  clientId: string;
  trackingId: string;
  userId?: string;
  anonymizeIp?: boolean;
  dataSource?: string;
  useCacheBooster?: boolean;
  referrer?: string;
  campaignName?: string;
  campaignSource?: string;
  campaignMedium?: string;
  appVersion?: string;
  appName?: string;
  appId?: string;
  appInstallerId?: string;
  debug?: boolean;
  debugEndpoint?: boolean;
  customMetrics?: CustomMetric[];
  customDimensions?: CustomDimension[];
}

export declare interface CustomMetric {
  index: number;
  value: number;
}

export declare interface CustomDimension {
  index: number;
  value: string;
}

export declare interface BaseHitOptions {
  customMetrics?: CustomMetric[];
  customDimensions?: CustomDimension[];
}

export interface Tracker {
  analytics: UniversalAnalytics;
  type: 'web'|'app';
}

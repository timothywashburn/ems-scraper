export interface FilterData {
  filterName: string;
  value: string;
  displayValue?: string;
  filterType?: number;
}

export interface EventsRequest {
  filterData: {
    filters: FilterData[];
  };
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
}

export interface ScraperStats {
  totalDays: number;
  totalEvents: number;
  inserted: number;
  updated: number;
  totalChanges: number;
  violations: string[];
}
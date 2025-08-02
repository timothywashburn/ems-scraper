import { UcsdApiEventData } from './event-types';
import { EventId } from "./id-types";

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

// API response structure from UCSD
export interface UCSDApiResponse {
    d: string;
    DailyBookingResults?: UcsdApiEventData[];
    MonthlyBookingResults?: UcsdApiEventData[];
}

// Utility type for change detection
export interface EventChanges {
    eventId: EventId;
    changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
    }>;
    changeCount: number;
}
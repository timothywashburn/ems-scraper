import { Serialized } from '../utils/serializing-utils';
import { TypedEvent, AvailableRoom } from './event-types';

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// Common query filters
export interface DateRangeFilter {
  start_date?: string; // ISO string
  end_date?: string;   // ISO string
}

// Analytics response types
export interface RoomUtilizationData {
  room_id: number;
  room_name: string;
  building_name: string;
  total_bookings: number;
  total_hours_booked: number;
  utilization_percentage: number;
  peak_hours: Array<{
    hour: number;
    booking_count: number;
  }>;
}

export interface ConflictAnalysis {
  conflicting_events: Array<{
    event1_id: number;
    event2_id: number;
    conflict_type: 'overlap' | 'double_booking';
    overlap_minutes: number;
  }>;
  total_conflicts: number;
}

export interface PeakTimesAnalysis {
  hourly_distribution: Array<{
    hour: number;
    booking_count: number;
    percentage: number;
  }>;
  daily_distribution: Array<{
    day_of_week: number;
    booking_count: number;
    percentage: number;
  }>;
  busiest_time_slots: Array<{
    time_slot: string;
    booking_count: number;
  }>;
}

// Serialized API response types
export interface GetEventsResponse {
  events: Serialized<TypedEvent>[];
}

export interface GetEventByIdResponse {
  event: Serialized<TypedEvent>;
}

export interface GetGroupsResponse {
  groups: Array<{
    name: string;
    event_count: number;
  }>;
}

export interface GetDailyAvailabilityResponse {
  date: string;
  rooms: Array<{
    room_id: number;
    room_name: string;
    room_code: string;
    building_id: number;
    building_name: string;
    room_type_id: number;
    room_type: string;
    availability_windows: Array<{
      start_time: string;
      end_time: string;
    }>;
    bookings: Array<{
      event_id: number;
      event_name: string;
      start_time: string;
      end_time: string;
      group_name: string;
    }>;
  }>;
}
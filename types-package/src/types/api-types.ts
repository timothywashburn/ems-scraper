import { Serialized } from '../utils';
import { TypedEvent, RawHistoricalEventData } from './event-types';
import { EventId } from "./id-types";

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
    room_name: string;
    room_type: string;
    building_name: string;
    availability: Array<{
      start_time: string;
      end_time: string;
    }>;
  }>;
}

export interface GetWeeklyAvailabilityResponse {
  week_start: string;
  days: GetDailyAvailabilityResponse[];
}

export interface GetMonthlyAvailabilityResponse {
  month: string;
  year: number;
  days: GetDailyAvailabilityResponse[];
}

export interface GetEventHistoryResponse {
  eventId: EventId;
  historyCount: number;
  history: Serialized<RawHistoricalEventData>[];
}

export interface GetRecentChangesResponse {
  count: number;
  changes: Serialized<RawHistoricalEventData>[];
}

export interface GetNoLongerFoundEventsResponse {
  count: number;
  events: Serialized<TypedEvent>[];
}
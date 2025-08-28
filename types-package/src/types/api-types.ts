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

export interface GetRecentArchivesResponse {
  count: number;
  changes: Serialized<RawHistoricalEventData>[];
}

export interface GetNoLongerFoundEventsResponse {
  count: number;
  events: Serialized<TypedEvent>[];
}

export interface ScriptInfo {
  name: string;
  tableName: string;
  recordCount: number;
  status: 'empty' | 'populated';
}

export interface GetScriptsStatusResponse {
  scripts: ScriptInfo[];
}

export interface RunScriptRequest {
  scriptName: string;
}

export interface RunScriptResponse {
  success: boolean;
  scriptName: string;
  message: string;
  recordsProcessed?: number;
}

export interface RunAllScriptsResponse {
  success: boolean;
  results: RunScriptResponse[];
  totalScripts: number;
  successfulScripts: number;
}
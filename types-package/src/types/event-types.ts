import {
  EventId,
  ReservationId,
  BuildingId,
  RoomId,
  RoomTypeId,
  StatusId,
  StatusTypeId,
  GroupId
} from './id-types';

// Base event data containing core fields
export interface EventData {
  id: EventId;
  event_name: string;
  event_start: string;
  event_end: string;
  gmt_start: string;
  gmt_end: string;
  time_booking_start: string;
  time_booking_end: string;
  is_all_day_event: boolean;
  timezone_abbreviation: string;
  building: string;
  building_id: BuildingId;
  room: string;
  room_id: RoomId;
  room_code: string;
  room_type: string;
  room_type_id: RoomTypeId;
  location: string;
  location_link: string;
  group_name: string;
  reservation_id: ReservationId;
  reservation_summary_url: string;
  status_id: StatusId;
  status_type_id: StatusTypeId;
  web_user_is_owner: boolean;
}

// Current event data with metadata and version tracking
export interface RawEventData extends EventData {
  version_number: number;
  created_at: Date | null;
  updated_at: Date | null;
  last_checked: Date | null;
  no_longer_found_at: Date | null;
  status_name?: string;
}

// Historical event data (archived versions)
export interface RawHistoricalEventData extends EventData {
  history_id: number;
  version_number: number;
  archived_at: Date;
  last_checked: Date;
  change_count: number;
}

// Strongly-typed event interface using branded IDs (alias for backward compatibility)
export interface TypedEvent extends RawEventData {}

// Location-related types
export interface BuildingInfo {
  id: BuildingId;
  name: string;
}

export interface RoomInfo {
  id: RoomId;
  name: string;
  code: string;
  type: string;
  type_id: RoomTypeId;
  building_id: BuildingId;
}

export interface RoomTypeInfo {
  id: RoomTypeId;
  name: string;
}

// Group/Organization info
export interface GroupInfo {
  id: GroupId;
  name: string;
}

// Status info
export interface StatusInfo {
  id: StatusId;
  name: string;
  type_id: StatusTypeId;
}

// Event search/filter types
export interface EventFilters {
  building_ids?: BuildingId[];
  room_ids?: RoomId[];
  room_type_ids?: RoomTypeId[];
  group_names?: string[];
  start_date?: Date;
  end_date?: Date;
  is_all_day?: boolean;
}

// Availability types for scheduling assistance
export interface AvailabilityQuery {
  start_time: Date;
  end_time: Date;
  building_ids?: BuildingId[];
  room_type_ids?: RoomTypeId[];
  required_capacity?: number;
}

// Raw API event data from UCSD (before processing)
export interface UcsdApiEventData {
  // All the raw fields from the API (for reference)
  InternalId: number;
  EventCount: number;
  GmtStart: string;
  GmtEnd: string;
  EventName: string;
  GroupId: number;
  GroupName: string;
  Location: string;
  Building: string;
  BuildingId: number;
  Room: string;
  RoomTypeId: number;
  RoomType: string;
  RoomCode: string;
  FloorID: number;
  Floor: string | null;
  ImageHeight: number;
  ImageWidth: number;
  RoomOverrideDescription: string | null;
  ShowFloorMap: boolean;
  Setup: string | null;
  VideoConferenceHost: boolean;
  ChangeHost: boolean;
  EventTime: string | null;
  ReserveType: number;
  StatusType: number;
  Status: string | null;
  StatusId: number;
  StatusTypeId: number;
  ImageId: number;
  IsCheckedIn: boolean;
  CanCheckIn: boolean;
  ShowCheckinButton: boolean;
  RequiresCheckIn: boolean;
  CheckInMinutes: number;
  AllowCancel: boolean;
  AllowCancelPamInstance: boolean;
  RequiresCancelReason: boolean;
  DefaultCancelReason: number;
  AllowEndNow: boolean;
  AllowEdit: boolean;
  EditBtnAltText: string | null;
  EditBtnFunctionType: string | null;
  EditBtnFunctionValue: string | null;
  ShowAddServices: boolean;
  HasServices: boolean;
  AddServicesFunctionValue: string | null;
  ReservationSummaryUrl: string;
  EventLink: string | null;
  LocationLink: string;
  TotalNumberOfBookings: number;
  WebUserIsOwner: boolean;
  IsHoliday: boolean;
  IsAllDayEvent: boolean;
  TimezoneAbbreviation: string;
  OccurrenceCount: number;
  IsCalendaringEnabled: boolean;
  IsSkypeEnabled: boolean;
  IsTeamsEnabled: boolean;
  IsWebexEnabled: boolean;
  IsZoomEnabled: boolean;
  UserEventStart: string;
  UserEventEnd: string;
  EventGmtStart: string;
  EventGmtEnd: string;
  ConferenceURL: string | null;
  ConferencingSolution: string | null;
  Id: number;
  ReservationId: number;
  RoomId: number;
  Date: string | null;
  EventStart: string;
  EventEnd: string;
  TimeBookingStart: string;
  TimeBookingEnd: string;
}

export interface AvailableRoom {
  room_id: RoomId;
  room_name: string;
  room_code: string;
  building_id: BuildingId;
  building_name: string;
  room_type_id: RoomTypeId;
  room_type: string;
  available_from: Date;
  available_until: Date;
}

// For monitoring constant fields
export interface RawConstantField {
  id: number;
  field_name: string;
  expected_value: string;
}

// For logging constant field violations
export interface RawConstantViolation {
  id: number;
  event_id: number;
  field_name: string;
  expected_value: string;
  actual_value: string;
  violation_time: Date;
}

// Field constants for single source of truth across client/server
export const EVENT_COMPARABLE_FIELDS = [
  'id', 'event_name', 'event_start', 'event_end', 'gmt_start', 'gmt_end',
  'time_booking_start', 'time_booking_end', 'is_all_day_event', 'timezone_abbreviation',
  'building', 'building_id', 'room', 'room_id', 'room_code', 'room_type', 'room_type_id',
  'location', 'location_link', 'group_name', 'reservation_id', 'reservation_summary_url',
  'status_id', 'status_type_id', 'web_user_is_owner'
] as const satisfies readonly (keyof EventData)[];

export const EVENT_METADATA_FIELDS = [
  'version_number', 'created_at', 'updated_at', 'last_checked', 'no_longer_found_at', 'archived_at', 'change_count'
] as const;

export const EVENT_DISPLAY_FIELDS = [
  ...EVENT_COMPARABLE_FIELDS,
  ...EVENT_METADATA_FIELDS
] as const;

export type EventComparableField = typeof EVENT_COMPARABLE_FIELDS[number];
export type EventMetadataField = typeof EVENT_METADATA_FIELDS[number];
export type EventDisplayField = typeof EVENT_DISPLAY_FIELDS[number];

// Field metadata for UI display purposes
export const EVENT_FIELD_METADATA: Record<EventDisplayField, { label: string; group: string }> = {
  // Core fields
  'id': { label: 'Event ID', group: 'Core' },
  'event_name': { label: 'Event Name', group: 'Core' },
  
  // Time fields
  'event_start': { label: 'Event Start', group: 'Time' },
  'event_end': { label: 'Event End', group: 'Time' },
  'gmt_start': { label: 'GMT Start', group: 'Time' },
  'gmt_end': { label: 'GMT End', group: 'Time' },
  'time_booking_start': { label: 'Booking Start', group: 'Time' },
  'time_booking_end': { label: 'Booking End', group: 'Time' },
  'is_all_day_event': { label: 'All Day Event', group: 'Time' },
  'timezone_abbreviation': { label: 'Timezone', group: 'Time' },
  
  // Location fields
  'building': { label: 'Building', group: 'Location' },
  'building_id': { label: 'Building ID', group: 'Location' },
  'room': { label: 'Room', group: 'Location' },
  'room_id': { label: 'Room ID', group: 'Location' },
  'room_code': { label: 'Room Code', group: 'Location' },
  'room_type': { label: 'Room Type', group: 'Location' },
  'room_type_id': { label: 'Room Type ID', group: 'Location' },
  'location': { label: 'Location', group: 'Location' },
  'location_link': { label: 'Location Link', group: 'Location' },
  
  // Organization fields
  'group_name': { label: 'Group Name', group: 'Organization' },
  'reservation_id': { label: 'Reservation ID', group: 'Organization' },
  'reservation_summary_url': { label: 'Reservation URL', group: 'Organization' },
  
  // Status fields
  'status_id': { label: 'Status ID', group: 'Status' },
  'status_type_id': { label: 'Status Type ID', group: 'Status' },
  'web_user_is_owner': { label: 'Web User Is Owner', group: 'Status' },
  
  // Metadata fields
  'version_number': { label: 'Version Number', group: 'Metadata' },
  'created_at': { label: 'Created At', group: 'Metadata' },
  'updated_at': { label: 'Updated At', group: 'Metadata' },
  'last_checked': { label: 'Last Checked', group: 'Metadata' },
  'no_longer_found_at': { label: 'No Longer Found At', group: 'Metadata' },
  'archived_at': { label: 'Archived At', group: 'Metadata' },
  'change_count': { label: 'Change Count', group: 'Metadata' }
} as const;
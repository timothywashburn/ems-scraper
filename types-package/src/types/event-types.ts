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
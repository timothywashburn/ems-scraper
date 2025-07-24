// TypeScript interfaces for UCSD Events data
// Based on analysis of 81,924 events from validator

export interface RawEventData {
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

// Cleaned event data we actually store in database
export interface Event {
  id: number;
  event_name: string;
  event_start: Date;
  event_end: Date;
  gmt_start: Date;
  gmt_end: Date;
  time_booking_start: Date;
  time_booking_end: Date;
  is_all_day_event: boolean;
  timezone_abbreviation: string;
  building: string;
  building_id: number;
  room: string;
  room_id: number;
  room_code: string;
  room_type: string;
  room_type_id: number;
  location: string;
  location_link: string;
  group_name: string;
  reservation_id: number;
  reservation_summary_url: string;
  status_id: number;
  status_type_id: number;
  web_user_is_owner: boolean;
  created_at: Date;
  updated_at: Date;
}

// API response structure from UCSD
export interface UCSDApiResponse {
  d: string;
  DailyBookingResults?: RawEventData[];
  MonthlyBookingResults?: RawEventData[];
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

// Utility type for change detection
export interface EventChanges {
  eventId: number;
  changes: Array<{
    field: keyof Event;
    oldValue: any;
    newValue: any;
  }>;
  changeCount: number;
}
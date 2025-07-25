import { prisma } from '@/lib/prisma';
import { Event, RawEventData, EventChanges } from '@/types/event-types';
import { raw_events } from '@prisma/client';

// Expected constant field values for monitoring
const EXPECTED_CONSTANTS: Record<string, string> = {
  'AllowCancel': 'false',
  'AllowCancelPamInstance': 'false',
  'AllowEdit': 'false',
  'AllowEndNow': 'false',
  'CanCheckIn': 'false',
  'ChangeHost': 'false',
  'CheckInMinutes': '0',
  'DefaultCancelReason': '0',
  'EventCount': '0',
  'FloorID': '0',
  'GroupId': '0',
  'HasServices': 'false',
  'ImageHeight': '0',
  'ImageId': '0',
  'ImageWidth': '0',
  'InternalId': '0',
  'IsCalendaringEnabled': 'false',
  'IsCheckedIn': 'false',
  'IsHoliday': 'false',
  'IsSkypeEnabled': 'false',
  'IsTeamsEnabled': 'false',
  'IsWebexEnabled': 'false',
  'IsZoomEnabled': 'false',
  'OccurrenceCount': '0',
  'RequiresCancelReason': 'false',
  'RequiresCheckIn': 'false',
  'ReserveType': '0',
  'ShowAddServices': 'false',
  'ShowCheckinButton': 'false',
  'ShowFloorMap': 'false',
  'StatusType': '0',
  'TotalNumberOfBookings': '0',
  'VideoConferenceHost': 'false',
  'EventGmtEnd': '0001-01-01T00:00:00',
  'EventGmtStart': '0001-01-01T00:00:00',
  'UserEventEnd': '0001-01-01T00:00:00',
  'UserEventStart': '0001-01-01T00:00:00'
} as const;

export class EventModel {
  constructor() {}

  // Transform raw API data to database format
  private transformRawEvent(raw: RawEventData): Omit<raw_events, 'created_at' | 'updated_at' | 'last_checked'> {
    return {
      id: raw.Id,
      event_name: raw.EventName,
      event_start: new Date(raw.EventStart),
      event_end: new Date(raw.EventEnd),
      gmt_start: new Date(raw.GmtStart),
      gmt_end: new Date(raw.GmtEnd),
      time_booking_start: new Date(raw.TimeBookingStart),
      time_booking_end: new Date(raw.TimeBookingEnd),
      is_all_day_event: raw.IsAllDayEvent,
      timezone_abbreviation: raw.TimezoneAbbreviation,
      building: raw.Building,
      building_id: raw.BuildingId,
      room: raw.Room,
      room_id: raw.RoomId,
      room_code: raw.RoomCode,
      room_type: raw.RoomType,
      room_type_id: raw.RoomTypeId,
      location: raw.Location,
      location_link: raw.LocationLink,
      group_name: raw.GroupName,
      reservation_id: raw.ReservationId,
      reservation_summary_url: raw.ReservationSummaryUrl,
      status_id: raw.StatusId,
      status_type_id: raw.StatusTypeId,
      web_user_is_owner: raw.WebUserIsOwner
    };
  }

  // Insert new event
  async insertEvent(rawEvent: RawEventData): Promise<void> {
    const event = this.transformRawEvent(rawEvent);
    const now = new Date();
    
    await prisma.raw_events.create({
      data: {
        ...event,
        created_at: now,
        updated_at: now,
        last_checked: now
      }
    });
  }

  // Check if event exists and get current data
  async getEventById(id: number): Promise<raw_events | null> {
    return await prisma.raw_events.findUnique({
      where: { id }
    });
  }

  // Update existing event and detect changes
  async updateEvent(rawEvent: RawEventData): Promise<EventChanges | null> {
    const existingEvent = await this.getEventById(rawEvent.Id);
    if (!existingEvent) {
      throw new Error(`Event with ID ${rawEvent.Id} not found`);
    }

    const newEvent = this.transformRawEvent(rawEvent);
    const changes: EventChanges['changes'] = [];

    // Compare all fields except metadata
    const fieldsToCompare: (keyof Omit<raw_events, 'created_at' | 'updated_at' | 'last_checked'>)[] = [
      'id', 'event_name', 'event_start', 'event_end', 'gmt_start', 'gmt_end',
      'time_booking_start', 'time_booking_end', 'is_all_day_event', 'timezone_abbreviation',
      'building', 'building_id', 'room', 'room_id', 'room_code', 'room_type', 'room_type_id',
      'location', 'location_link', 'group_name', 'reservation_id', 'reservation_summary_url',
      'status_id', 'status_type_id', 'web_user_is_owner'
    ];

    for (const field of fieldsToCompare) {
      const oldValue = existingEvent[field];
      const newValue = newEvent[field];
      
      // Handle date comparison
      if (oldValue instanceof Date && newValue instanceof Date) {
        if (oldValue.getTime() !== newValue.getTime()) {
          changes.push({ field, oldValue, newValue });
        }
      } else if (oldValue !== newValue) {
        changes.push({ field, oldValue, newValue });
      }
    }

    // If no changes, return null
    if (changes.length === 0) {
      return null;
    }

    // Update the event
    const now = new Date();
    await prisma.raw_events.update({
      where: { id: newEvent.id },
      data: {
        ...newEvent,
        updated_at: now,
        last_checked: now
      }
    });

    return {
      eventId: rawEvent.Id,
      changes,
      changeCount: changes.length
    };
  }

  // Upsert event (insert or update)
  async upsertEvent(rawEvent: RawEventData): Promise<{ action: 'inserted' | 'updated'; changes?: EventChanges }> {
    const existingEvent = await this.getEventById(rawEvent.Id);
    
    if (!existingEvent) {
      await this.insertEvent(rawEvent);
      return { action: 'inserted' };
    } else {
      const changes = await this.updateEvent(rawEvent);
      return { action: 'updated', changes: changes || undefined };
    }
  }

  // Bulk upsert for performance
  async bulkUpsertEvents(rawEvents: RawEventData[]): Promise<{
    inserted: number;
    updated: number;
    totalChanges: number;
  }> {
    let inserted = 0;
    let updated = 0;
    let totalChanges = 0;

    for (const rawEvent of rawEvents) {
      const result = await this.upsertEvent(rawEvent);
      if (result.action === 'inserted') {
        inserted++;
      } else {
        updated++;
        if (result.changes) {
          totalChanges += result.changes.changeCount;
        }
      }
    }

    return { inserted, updated, totalChanges };
  }

  // Monitor constant fields for violations and log them
  async checkConstantFields(rawEvent: RawEventData): Promise<string[]> {
    const violations: string[] = [];

    for (const [fieldName, expectedValue] of Object.entries(EXPECTED_CONSTANTS)) {
      // Safely parse expected value - handle both JSON strings and primitive values
      let parsedExpectedValue: any;
      try {
        parsedExpectedValue = JSON.parse(expectedValue);
      } catch (error) {
        // If JSON.parse fails, treat as primitive value
        parsedExpectedValue = expectedValue;
      }
      
      const actualValue = (rawEvent as any)[fieldName];

      if (actualValue !== parsedExpectedValue) {
        const violationMsg = `${fieldName}: expected ${parsedExpectedValue}, got ${actualValue}`;
        violations.push(violationMsg);
        
        // Log the violation to raw_constant_violations table
        await prisma.raw_constant_violations.create({
          data: {
            event_id: rawEvent.Id,
            field_name: fieldName,
            expected_value: JSON.stringify(parsedExpectedValue),
            actual_value: JSON.stringify(actualValue)
          }
        });
      }
    }

    return violations;
  }

  // Get events by date range
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<raw_events[]> {
    return await prisma.raw_events.findMany({
      where: {
        event_start: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        event_start: 'asc'
      }
    });
  }

  // Get events by building
  async getEventsByBuilding(buildingId: number): Promise<raw_events[]> {
    return await prisma.raw_events.findMany({
      where: {
        building_id: buildingId
      },
      orderBy: {
        event_start: 'asc'
      }
    });
  }

  // Update last_checked timestamp for events (without affecting updated_at)
  async updateLastChecked(eventIds: number[]): Promise<void> {
    if (eventIds.length === 0) return;
    
    await prisma.raw_events.updateMany({
      where: {
        id: {
          in: eventIds
        }
      },
      data: {
        last_checked: new Date()
      }
    });
  }
}
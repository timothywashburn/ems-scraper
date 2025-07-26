import { prisma } from '@/lib/prisma';
import { Event, RawEventData, EventChanges } from '@/types/event-types';
import { EventId, IdConverters } from '@timothyw/ems-scraper-types';
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

  // Transform raw API data to database format - store dates as raw strings
  private transformRawEvent(raw: RawEventData): Omit<raw_events, 'created_at' | 'updated_at' | 'last_checked' | 'no_longer_found_at'> {
    return {
      id: IdConverters.fromEventId(IdConverters.toEventId(raw.Id)),
      event_name: raw.EventName,
      event_start: raw.EventStart,
      event_end: raw.EventEnd,
      gmt_start: raw.GmtStart,
      gmt_end: raw.GmtEnd,
      time_booking_start: raw.TimeBookingStart,
      time_booking_end: raw.TimeBookingEnd,
      is_all_day_event: raw.IsAllDayEvent,
      timezone_abbreviation: raw.TimezoneAbbreviation,
      building: raw.Building,
      building_id: IdConverters.fromBuildingId(IdConverters.toBuildingId(raw.BuildingId)),
      room: raw.Room,
      room_id: IdConverters.fromRoomId(IdConverters.toRoomId(raw.RoomId)),
      room_code: raw.RoomCode,
      room_type: raw.RoomType,
      room_type_id: IdConverters.fromRoomTypeId(IdConverters.toRoomTypeId(raw.RoomTypeId)),
      location: raw.Location,
      location_link: raw.LocationLink,
      group_name: raw.GroupName,
      reservation_id: IdConverters.fromReservationId(IdConverters.toReservationId(raw.ReservationId)),
      reservation_summary_url: raw.ReservationSummaryUrl,
      status_id: IdConverters.fromStatusId(IdConverters.toStatusId(raw.StatusId)),
      status_type_id: IdConverters.fromStatusTypeId(IdConverters.toStatusTypeId(raw.StatusTypeId)),
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
  async getEventById(id: EventId): Promise<raw_events | null> {
    return await prisma.raw_events.findUnique({
      where: { id: IdConverters.fromEventId(id) }
    });
  }

  // Detect changes without updating (for dry run analysis)
  async detectChanges(rawEvent: RawEventData, existingEvent: raw_events): Promise<EventChanges | null> {
    const newEvent = this.transformRawEvent(rawEvent);
    const changes: EventChanges['changes'] = [];

    // Compare all fields except metadata
    const fieldsToCompare: (keyof Omit<raw_events, 'created_at' | 'updated_at' | 'last_checked' | 'no_longer_found_at'>)[] = [
      'id', 'event_name', 'event_start', 'event_end', 'gmt_start', 'gmt_end',
      'time_booking_start', 'time_booking_end', 'is_all_day_event', 'timezone_abbreviation',
      'building', 'building_id', 'room', 'room_id', 'room_code', 'room_type', 'room_type_id',
      'location', 'location_link', 'group_name', 'reservation_id', 'reservation_summary_url',
      'status_id', 'status_type_id', 'web_user_is_owner'
    ];

    for (const field of fieldsToCompare) {
      const oldValue = existingEvent[field];
      const newValue = newEvent[field];
      
      // Simple string/value comparison (dates are now strings)
      if (oldValue !== newValue) {
        changes.push({ field, oldValue, newValue });
      }
    }

    // If no changes, return null
    if (changes.length === 0) {
      return null;
    }

    return {
      eventId: IdConverters.toEventId(rawEvent.Id),
      changes,
      changeCount: changes.length
    };
  }

  // Update existing event and detect changes
  async updateEvent(rawEvent: RawEventData): Promise<EventChanges | null> {
    const existingEvent = await this.getEventById(IdConverters.toEventId(rawEvent.Id));
    if (!existingEvent) {
      throw new Error(`Event with ID ${rawEvent.Id} not found`);
    }

    const changes = await this.detectChanges(rawEvent, existingEvent);

    // If no changes, return null
    if (!changes) {
      return null;
    }

    // Update the event
    const newEvent = this.transformRawEvent(rawEvent);
    const now = new Date();
    await prisma.raw_events.update({
      where: { id: newEvent.id },
      data: {
        ...newEvent,
        updated_at: now,
        last_checked: now
      }
    });

    return changes;
  }

  // Upsert event (insert or update)
  async upsertEvent(rawEvent: RawEventData): Promise<{ action: 'inserted' | 'updated'; changes?: EventChanges }> {
    const existingEvent = await this.getEventById(IdConverters.toEventId(rawEvent.Id));
    
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

  // Update last_checked timestamp for events (without affecting updated_at)
  async updateLastChecked(eventIds: EventId[]): Promise<void> {
    if (eventIds.length === 0) return;
    
    await prisma.raw_events.updateMany({
      where: {
        id: {
          in: eventIds.map(id => IdConverters.fromEventId(id))
        }
      },
      data: {
        last_checked: new Date()
      }
    });
  }

  // Mark events as no longer found on their scheduled day
  async markEventsNoLongerFound(eventIds: EventId[]): Promise<void> {
    if (eventIds.length === 0) return;
    
    const now = new Date();
    await prisma.raw_events.updateMany({
      where: {
        id: {
          in: eventIds.map(id => IdConverters.fromEventId(id))
        }
      },
      data: {
        no_longer_found_at: now,
        last_checked: now
      }
    });
  }

  // Clear the no_longer_found_at timestamp when event is found again
  async clearNoLongerFound(eventIds: EventId[]): Promise<void> {
    if (eventIds.length === 0) return;
    
    await prisma.raw_events.updateMany({
      where: {
        id: {
          in: eventIds.map(id => IdConverters.fromEventId(id))
        }
      },
      data: {
        no_longer_found_at: null,
        last_checked: new Date()
      }
    });
  }

  // Get events for a specific date
  async getEventsForDate(date: Date): Promise<{id: EventId; no_longer_found_at: Date | null}[]> {
    const dateStr = date.toISOString().split('T')[0];
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    const results = await prisma.raw_events.findMany({
      where: {
        event_start: {
          gte: dateStr,
          lt: nextDayStr
        }
      },
      select: {
        id: true,
        no_longer_found_at: true
      }
    });
    
    return results.map(result => ({
      id: IdConverters.toEventId(result.id),
      no_longer_found_at: result.no_longer_found_at
    }));
  }
}
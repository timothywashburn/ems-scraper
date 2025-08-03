import { prisma } from '@/lib/prisma';
import { EventChanges, UcsdApiEventData, EventId, IdConverters, EVENT_COMPARABLE_FIELDS } from '@timothyw/ems-scraper-types';
import { raw_events, raw_events_history } from '@prisma/client';

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
    private constructor() {
    }

    // Transform raw API data to database format - store dates as raw strings
    private static transformRawEvent(raw: UcsdApiEventData): Omit<raw_events, 'version_number' | 'created_at' | 'updated_at' | 'last_checked' | 'no_longer_found_at'> {
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
    static async insertEvent(rawEvent: UcsdApiEventData): Promise<void> {
        const event = EventModel.transformRawEvent(rawEvent);
        const now = new Date();

        await prisma.raw_events.create({
            data: {
                ...event,
                version_number: 1,
                created_at: now,
                updated_at: now,
                last_checked: now
            }
        });
    }

    // Check if event exists and get current data
    static async getEventById(id: EventId): Promise<raw_events | null> {
        return await prisma.raw_events.findUnique({
            where: { id: IdConverters.fromEventId(id) }
        });
    }

    // Detect changes without updating (for dry run analysis)
    static async detectChanges(rawEvent: UcsdApiEventData, existingEvent: raw_events): Promise<EventChanges | null> {
        const newEvent = EventModel.transformRawEvent(rawEvent);
        const changes: EventChanges['changes'] = [];

        // Compare all fields except metadata - using shared constant for consistency
        const fieldsToCompare = EVENT_COMPARABLE_FIELDS;

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

    // Archive current event data to history before updating
    private static async archiveEventToHistory(existingEvent: raw_events, changes: EventChanges): Promise<void> {
        // Get the current highest version number for this event
        const latestHistoryRecord = await prisma.raw_events_history.findFirst({
            where: { event_id: existingEvent.id },
            orderBy: { version_number: 'desc' },
            select: { version_number: true }
        });

        const nextVersionNumber = latestHistoryRecord ? latestHistoryRecord.version_number + 1 : 1;

        // Archive the current data before it gets updated
        await prisma.raw_events_history.create({
            data: {
                event_id: existingEvent.id,
                version_number: nextVersionNumber,
                change_count: changes.changeCount,
                last_checked: existingEvent.last_checked || new Date(),
                
                // Snapshot of all current event data
                event_name: existingEvent.event_name,
                event_start: existingEvent.event_start,
                event_end: existingEvent.event_end,
                gmt_start: existingEvent.gmt_start,
                gmt_end: existingEvent.gmt_end,
                time_booking_start: existingEvent.time_booking_start,
                time_booking_end: existingEvent.time_booking_end,
                is_all_day_event: existingEvent.is_all_day_event,
                timezone_abbreviation: existingEvent.timezone_abbreviation,
                building: existingEvent.building,
                building_id: existingEvent.building_id,
                room: existingEvent.room,
                room_id: existingEvent.room_id,
                room_code: existingEvent.room_code,
                room_type: existingEvent.room_type,
                room_type_id: existingEvent.room_type_id,
                location: existingEvent.location,
                location_link: existingEvent.location_link,
                group_name: existingEvent.group_name,
                reservation_id: existingEvent.reservation_id,
                reservation_summary_url: existingEvent.reservation_summary_url,
                status_id: existingEvent.status_id,
                status_type_id: existingEvent.status_type_id,
                web_user_is_owner: existingEvent.web_user_is_owner
            }
        });
    }

    // Update existing event and detect changes
    static async updateEvent(rawEvent: UcsdApiEventData): Promise<EventChanges | null> {
        const existingEvent = await EventModel.getEventById(IdConverters.toEventId(rawEvent.Id));
        if (!existingEvent) {
            throw new Error(`Event with ID ${rawEvent.Id} not found`);
        }

        const changes = await EventModel.detectChanges(rawEvent, existingEvent);

        // If no changes, return null
        if (!changes) {
            return null;
        }

        // Archive the current data to history before updating
        await EventModel.archiveEventToHistory(existingEvent, changes);

        // Update the event with incremented version
        const newEvent = EventModel.transformRawEvent(rawEvent);
        const now = new Date();
        await prisma.raw_events.update({
            where: { id: newEvent.id },
            data: {
                ...newEvent,
                version_number: existingEvent.version_number + 1,
                updated_at: now,
                last_checked: now
            }
        });

        return changes;
    }

    // Upsert event (insert or update)
    static async upsertEvent(rawEvent: UcsdApiEventData): Promise<{ action: 'inserted' | 'updated'; changes?: EventChanges }> {
        const existingEvent = await EventModel.getEventById(IdConverters.toEventId(rawEvent.Id));

        if (!existingEvent) {
            await EventModel.insertEvent(rawEvent);
            return { action: 'inserted' };
        } else {
            const changes = await EventModel.updateEvent(rawEvent);
            return { action: 'updated', changes: changes || undefined };
        }
    }

    // Bulk upsert for performance
    static async bulkUpsertEvents(rawEvents: UcsdApiEventData[]): Promise<{
        inserted: number;
        updated: number;
        totalChanges: number;
    }> {
        let inserted = 0;
        let updated = 0;
        let totalChanges = 0;

        for (const rawEvent of rawEvents) {
            const result = await EventModel.upsertEvent(rawEvent);
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
    static async checkConstantFields(rawEvent: UcsdApiEventData): Promise<string[]> {
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
    static async updateLastChecked(eventIds: EventId[]): Promise<void> {
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
    static async markEventsNoLongerFound(eventIds: EventId[]): Promise<number> {
        if (eventIds.length === 0) return 0;

        const now = new Date();
        const result = await prisma.raw_events.updateMany({
            where: {
                id: {
                    in: eventIds.map(id => IdConverters.fromEventId(id))
                },
                no_longer_found_at: null // Only update events that haven't been marked yet
            },
            data: {
                no_longer_found_at: now,
                last_checked: now
            }
        });

        return result.count;
    }

    // Clear the no_longer_found_at timestamp when event is found again
    static async clearNoLongerFound(eventIds: EventId[]): Promise<void> {
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
    static async getEventsForDate(date: Date): Promise<{ id: EventId; no_longer_found_at: Date | null }[]> {
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

    // Get historical versions of an event
    static async getEventHistory(eventId: EventId): Promise<raw_events_history[]> {
        const results = await prisma.raw_events_history.findMany({
            where: { event_id: IdConverters.fromEventId(eventId) },
            orderBy: { version_number: 'desc' }
        });

        return results;
    }

    // Get the latest N changes across all events
    static async getRecentChanges(limit: number = 50): Promise<raw_events_history[]> {
        const results = await prisma.raw_events_history.findMany({
            orderBy: { archived_at: 'desc' },
            take: limit
        });

        return results;
    }

}
import { IdConverters, RawEventData, RawHistoricalEventData } from '@timothyw/ems-scraper-types';
import { raw_events, raw_events_history } from '@prisma/client';

/**
 * Transform database raw_events to RawEventData with branded IDs
 */
export function transformRawEventToTyped(event: raw_events): RawEventData {
    return {
        id: IdConverters.toEventId(event.id),
        version_number: event.version_number,
        created_at: event.created_at,
        updated_at: event.updated_at,
        last_checked: event.last_checked,
        no_longer_found_at: event.no_longer_found_at,
        event_name: event.event_name,
        event_start: event.event_start,
        event_end: event.event_end,
        gmt_start: event.gmt_start,
        gmt_end: event.gmt_end,
        time_booking_start: event.time_booking_start,
        time_booking_end: event.time_booking_end,
        is_all_day_event: event.is_all_day_event,
        timezone_abbreviation: event.timezone_abbreviation,
        building: event.building,
        building_id: IdConverters.toBuildingId(event.building_id),
        room: event.room,
        room_id: IdConverters.toRoomId(event.room_id),
        room_code: event.room_code,
        room_type: event.room_type,
        room_type_id: IdConverters.toRoomTypeId(event.room_type_id),
        location: event.location,
        location_link: event.location_link,
        group_name: event.group_name,
        reservation_id: IdConverters.toReservationId(event.reservation_id),
        reservation_summary_url: event.reservation_summary_url,
        status_id: IdConverters.toStatusId(event.status_id),
        status_type_id: IdConverters.toStatusTypeId(event.status_type_id),
        web_user_is_owner: event.web_user_is_owner
    };
}

/**
 * Transform database raw_events_history to RawHistoricalEventData with branded IDs
 */
export function transformHistoryEventToTyped(historyEvent: raw_events_history): RawHistoricalEventData {
    return {
        history_id: historyEvent.id,
        id: IdConverters.toEventId(historyEvent.event_id),
        version_number: historyEvent.version_number,
        archived_at: historyEvent.archived_at,
        change_count: historyEvent.change_count,
        event_name: historyEvent.event_name,
        event_start: historyEvent.event_start,
        event_end: historyEvent.event_end,
        gmt_start: historyEvent.gmt_start,
        gmt_end: historyEvent.gmt_end,
        time_booking_start: historyEvent.time_booking_start,
        time_booking_end: historyEvent.time_booking_end,
        is_all_day_event: historyEvent.is_all_day_event,
        timezone_abbreviation: historyEvent.timezone_abbreviation,
        building: historyEvent.building,
        building_id: IdConverters.toBuildingId(historyEvent.building_id),
        room: historyEvent.room,
        room_id: IdConverters.toRoomId(historyEvent.room_id),
        room_code: historyEvent.room_code,
        room_type: historyEvent.room_type,
        room_type_id: IdConverters.toRoomTypeId(historyEvent.room_type_id),
        location: historyEvent.location,
        location_link: historyEvent.location_link,
        group_name: historyEvent.group_name,
        reservation_id: IdConverters.toReservationId(historyEvent.reservation_id),
        reservation_summary_url: historyEvent.reservation_summary_url,
        status_id: IdConverters.toStatusId(historyEvent.status_id),
        status_type_id: IdConverters.toStatusTypeId(historyEvent.status_type_id),
        web_user_is_owner: historyEvent.web_user_is_owner
    };
}

/**
 * Transform array of raw_events to typed events
 */
export function transformRawEventsToTyped(events: raw_events[]): RawEventData[] {
    return events.map(transformRawEventToTyped);
}

/**
 * Transform array of raw_events_history to typed historical events
 */
export function transformHistoryEventsToTyped(historyEvents: raw_events_history[]): RawHistoricalEventData[] {
    return historyEvents.map(transformHistoryEventToTyped);
}
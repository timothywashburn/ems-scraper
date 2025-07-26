import { ApiEndpoint, AuthType, ApiRequest, ApiResponse } from '@/types/api-types';
import { Serializer, IdConverters, GetEventByIdResponse } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';

export const getEventByIdEndpoint: ApiEndpoint<undefined, GetEventByIdResponse> = {
  method: 'get',
  path: '/api/events/:id',
  auth: AuthType.NONE,
  handler: async (req, res) => {
    try {
      const { id } = req.params;
      
      const eventId = parseInt(id);
      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid event ID',
            code: 'INVALID_EVENT_ID'
          }
        });
        return;
      }

      const rawEvent = await prisma.raw_events.findUnique({
        where: { id: eventId }
      });

      if (!rawEvent) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Event not found',
            code: 'EVENT_NOT_FOUND'
          }
        });
        return;
      }

      // Convert to TypedEvent format with branded IDs
      const typedEvent = {
        id: IdConverters.toEventId(rawEvent.id),
        created_at: rawEvent.created_at,
        updated_at: rawEvent.updated_at,
        last_checked: rawEvent.last_checked,
        no_longer_found_at: rawEvent.no_longer_found_at,
        event_name: rawEvent.event_name,
        event_start: rawEvent.event_start,
        event_end: rawEvent.event_end,
        gmt_start: rawEvent.gmt_start,
        gmt_end: rawEvent.gmt_end,
        time_booking_start: rawEvent.time_booking_start,
        time_booking_end: rawEvent.time_booking_end,
        is_all_day_event: rawEvent.is_all_day_event,
        timezone_abbreviation: rawEvent.timezone_abbreviation,
        building: rawEvent.building,
        building_id: IdConverters.toBuildingId(rawEvent.building_id),
        room: rawEvent.room,
        room_id: IdConverters.toRoomId(rawEvent.room_id),
        room_code: rawEvent.room_code,
        room_type: rawEvent.room_type,
        room_type_id: IdConverters.toRoomTypeId(rawEvent.room_type_id),
        location: rawEvent.location,
        location_link: rawEvent.location_link,
        group_name: rawEvent.group_name,
        reservation_id: IdConverters.toReservationId(rawEvent.reservation_id),
        reservation_summary_url: rawEvent.reservation_summary_url,
        status_id: IdConverters.toStatusId(rawEvent.status_id),
        status_type_id: IdConverters.toStatusTypeId(rawEvent.status_type_id),
        web_user_is_owner: rawEvent.web_user_is_owner
      };

      // Serialize dates to strings
      const serializedEvent = Serializer.serialize(typedEvent);

      res.json({
        success: true,
        data: {
          event: serializedEvent
        }
      });
      return;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch event',
          code: 'FETCH_EVENT_ERROR'
        }
      });
    }
  }
};
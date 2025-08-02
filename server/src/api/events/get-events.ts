import { ApiEndpoint, AuthType } from '@/types/api-types';
import { GetEventsResponse, IdConverters, Serializer } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';

export const getEventsEndpoint: ApiEndpoint<undefined, GetEventsResponse> = {
    method: 'get',
    path: '/api/events',
    auth: AuthType.NONE,
    handler: async (req, res) => {
        try {
            const { date, group_name } = req.query;

            if (!date) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'date parameter is required (format: YYYY-MM-DD)',
                        code: 'MISSING_DATE'
                    }
                });
                return;
            }

            // Parse the date and create date range for the day
            const targetDate = new Date(date as string);
            if (isNaN(targetDate.getTime())) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid date format. Use YYYY-MM-DD',
                        code: 'INVALID_DATE'
                    }
                });
                return;
            }

            const dateStr = targetDate.toISOString().split('T')[0];
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            // Build filters
            const filters: any = {
                event_start: {
                    gte: dateStr,
                    lt: nextDayStr
                }
            };

            if (group_name) {
                filters.group_name = group_name as string;
            }

            const rawEvents = await prisma.raw_events.findMany({
                where: filters,
                orderBy: { event_start: 'asc' }
            });

            // Convert to TypedEvent format with branded IDs
            const typedEvents = rawEvents.map(event => ({
                id: IdConverters.toEventId(event.id),
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
            }));

            // Serialize dates to strings
            const serializedEvents = typedEvents.map(event => Serializer.serialize(event));

            res.json({
                success: true,
                data: {
                    events: serializedEvents
                }
            });
            return;
        } catch (error) {
            console.error('Error fetching events:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch events',
                    code: 'FETCH_EVENTS_ERROR'
                }
            });
        }
    }
};
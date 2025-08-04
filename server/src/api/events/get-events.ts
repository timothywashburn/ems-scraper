import { ApiEndpoint, AuthType } from '@/types/api-types';
import { GetEventsResponse, Serializer } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';
import { transformRawEventsToTyped } from '@/utils/event-transformers';

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

            // Transform to properly typed format
            const typedEvents = transformRawEventsToTyped(rawEvents);
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
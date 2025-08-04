import { ApiEndpoint, AuthType } from '@/types/api-types';
import { GetNoLongerFoundEventsResponse, Serializer } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';
import { transformRawEventsToTyped } from '@/utils/event-transformers';

export const getNoLongerFoundEventsEndpoint: ApiEndpoint<undefined, GetNoLongerFoundEventsResponse> = {
    method: 'get',
    path: '/api/events/missing',
    auth: AuthType.AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;

            if (limit > 500) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Limit cannot exceed 500',
                        code: 'LIMIT_EXCEEDED'
                    }
                });
                return;
            }

            const rawEvents = await prisma.raw_events.findMany({
                where: {
                    no_longer_found_at: {
                        not: null
                    }
                },
                orderBy: {
                    no_longer_found_at: 'desc'
                },
                take: limit
            });

            // Transform to properly typed format
            const typedEvents = transformRawEventsToTyped(rawEvents);
            const serializedEvents = typedEvents.map(event => Serializer.serialize(event));

            res.json({
                success: true,
                data: {
                    count: rawEvents.length,
                    events: serializedEvents
                }
            });
        } catch (error) {
            console.error('Error fetching no longer found events:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch no longer found events',
                    code: 'FETCH_NO_LONGER_FOUND_EVENTS_ERROR'
                }
            });
        }
    }
};
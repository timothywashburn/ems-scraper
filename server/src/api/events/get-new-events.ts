import { ApiEndpoint, AuthType } from '@/types/api-types';
import { GetEventsResponse, Serializer } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';
import { transformRawEventsToTyped } from '@/utils/event-transformers';

export const getNewEventsEndpoint: ApiEndpoint<undefined, GetEventsResponse> = {
    method: 'get',
    path: '/api/events/new',
    auth: AuthType.AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;

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

            const newEvents = await prisma.raw_events.findMany({
                orderBy: { created_at: 'desc' },
                take: limit
            });

            // Transform to properly typed format
            const typedEvents = transformRawEventsToTyped(newEvents);
            const serializedEvents = typedEvents.map(event => Serializer.serialize(event));

            res.json({
                success: true,
                data: {
                    events: serializedEvents
                }
            });
        } catch (error) {
            console.error('Error fetching new events:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch new events',
                    code: 'FETCH_EVENTS_ERROR'
                }
            });
        }
    }
};
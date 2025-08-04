import { ApiEndpoint, AuthType } from '@/types/api-types';
import { GetEventByIdResponse, IdConverters, Serializer } from '@timothyw/ems-scraper-types';
import { prisma } from '@/lib/prisma';
import { transformRawEventToTyped } from '@/utils/event-transformers';

export const getEventByIdEndpoint: ApiEndpoint<undefined, GetEventByIdResponse> = {
    method: 'get',
    path: '/api/events/:id/details',
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
                where: { id: eventId },
                include: {
                    statusRel: true
                }
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

            // Transform to properly typed format
            const typedEvent = transformRawEventToTyped(rawEvent);
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
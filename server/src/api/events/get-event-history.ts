import { ApiEndpoint, AuthType } from '@/types/api-types';
import { EventModel } from '@/models/event-model';
import { IdConverters, GetEventHistoryResponse, Serializer } from '@timothyw/ems-scraper-types';
import { transformHistoryEventsToTyped } from '@/utils/event-transformers';

export const getEventHistoryEndpoint: ApiEndpoint<undefined, GetEventHistoryResponse> = {
    method: 'get',
    path: '/api/events/:eventId/history',
    auth: AuthType.AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const eventId = parseInt(req.params.eventId);
            
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

            const history = await EventModel.getEventHistory(IdConverters.toEventId(eventId));
            
            // Transform history to properly typed format
            const typedHistory = transformHistoryEventsToTyped(history);
            const serializedHistory = typedHistory.map(h => Serializer.serialize(h));
            
            res.json({
                success: true,
                data: {
                    eventId: IdConverters.toEventId(eventId),
                    historyCount: history.length,
                    history: serializedHistory
                }
            });
        } catch (error) {
            console.error('Error fetching event history:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch event history',
                    code: 'FETCH_HISTORY_ERROR'
                }
            });
        }
    }
};
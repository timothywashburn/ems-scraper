import { ApiEndpoint, AuthType } from '@/types/api-types';
import { EventModel } from '@/models/event-model';
import { GetRecentChangesResponse, Serializer } from '@timothyw/ems-scraper-types';
import { transformHistoryEventsToTyped } from '@/utils/event-transformers';

export const getRecentChangesEndpoint: ApiEndpoint<undefined, GetRecentChangesResponse> = {
    method: 'get',
    path: '/api/events/recent-changes',
    auth: AuthType.AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;

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

            const changes = await EventModel.getRecentChanges(limit);

            // Transform changes to properly typed format
            const typedChanges = transformHistoryEventsToTyped(changes);
            const serializedChanges = typedChanges.map(c => Serializer.serialize(c));

            res.json({
                success: true,
                data: {
                    count: changes.length,
                    changes: serializedChanges
                }
            });
        } catch (error) {
            console.error('Error fetching recent changes:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch recent changes',
                    code: 'FETCH_CHANGES_ERROR'
                }
            });
        }
    }
};
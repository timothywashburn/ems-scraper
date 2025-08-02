import { ApiEndpoint, AuthType } from '@/types/api-types';
import { activityLogger } from '@/services/activity-logger';

interface ActivityLogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface ScraperLogsResponse {
    activities: ActivityLogEntry[];
}

export const scraperLogsEndpoint: ApiEndpoint<undefined, ScraperLogsResponse> = {
    method: 'get',
    path: '/api/scraper/logs',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const activities = activityLogger.getRecentActivities(50);

            const response: ScraperLogsResponse = {
                activities: activities.map(activity => ({
                    id: activity.id,
                    timestamp: activity.timestamp.toISOString(),
                    message: activity.message,
                    type: activity.type,
                })),
            };

            res.json({
                success: true,
                data: response,
            });
        } catch (error) {
            console.error('Failed to get scraper logs:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get scraper logs',
                    code: 'SCRAPER_LOGS_ERROR'
                },
            });
        }
    },
};
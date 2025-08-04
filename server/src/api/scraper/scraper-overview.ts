import { ApiEndpoint, AuthType } from '@/types/api-types';
import { ScraperService } from '@/services/scraper-service';
import { prisma } from '@/lib/prisma';

interface ScraperOverviewResponse {
    // Status info
    isRunning: boolean;
    currentDate?: string;
    lastUpdate?: string;

    // Metrics
    totalEvents: number;
    eventsToday: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
    lastEventUpdate: string | null;
}

export const scraperOverviewEndpoint: ApiEndpoint<undefined, ScraperOverviewResponse> = {
    method: 'get',
    path: '/api/scraper/overview',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            // Get scraper status
            const status = await ScraperService.getContinuousScraperStatus();

            // Get metrics
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            const [totalEvents, eventsToday, eventsThisWeek, eventsThisMonth] = await Promise.all([
                prisma.raw_events.count(),
                prisma.raw_events.count({
                    where: {
                        last_checked: {
                            gte: today
                        }
                    }
                }),
                prisma.raw_events.count({
                    where: {
                        last_checked: {
                            gte: weekAgo
                        }
                    }
                }),
                prisma.raw_events.count({
                    where: {
                        last_checked: {
                            gte: monthAgo
                        }
                    }
                })
            ]);

            // Get last event update
            const lastEvent = await prisma.raw_events.findFirst({
                orderBy: {
                    last_checked: 'desc'
                },
                select: {
                    last_checked: true
                }
            });

            const response: ScraperOverviewResponse = {
                isRunning: status.isRunning,
                currentDate: status.currentDate?.toISOString().split('T')[0],
                lastUpdate: status.lastUpdate?.toISOString(),
                totalEvents,
                eventsToday,
                eventsThisWeek,
                eventsThisMonth,
                lastEventUpdate: lastEvent?.last_checked?.toISOString() || null,
            };

            res.json({
                success: true,
                data: response,
            });
        } catch (error) {
            console.error('Failed to get scraper overview:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to get scraper overview',
                    code: 'SCRAPER_OVERVIEW_ERROR'
                },
            });
        }
    },
};
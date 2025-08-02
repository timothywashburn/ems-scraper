import { ApiEndpoint, AuthType } from '@/types/api-types';
import { ScraperService } from '@/services/scraper-service';

interface ScraperControlRequest {
    action: 'start' | 'stop';
}

interface ScraperControlResponse {
    success: boolean;
    action: string;
    message: string;
    isRunning: boolean;
}

export const scraperControlEndpoint: ApiEndpoint<ScraperControlRequest, ScraperControlResponse> = {
    method: 'post',
    path: '/api/scraper/control',
    auth: AuthType.ADMIN_AUTHENTICATED,
    handler: async (req, res) => {
        try {
            const { action } = req.body;

            if (!action || !['start', 'stop'].includes(action)) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid action. Must be "start" or "stop"',
                        code: 'INVALID_ACTION'
                    },
                });
                return;
            }

            if (action === 'start') {
                await ScraperService.startContinuousScraping();
                
                res.json({
                    success: true,
                    data: {
                        success: true,
                        action: 'start',
                        message: 'Scraper started successfully',
                        isRunning: true
                    },
                });
            } else if (action === 'stop') {
                await ScraperService.stopContinuousScraping();
                
                res.json({
                    success: true,
                    data: {
                        success: true,
                        action: 'stop',
                        message: 'Scraper stopped successfully',
                        isRunning: false
                    },
                });
            }
        } catch (error) {
            console.error(`Failed to ${req.body.action} scraper:`, error);
            res.status(500).json({
                success: false,
                error: {
                    message: `Failed to ${req.body.action} scraper`,
                    code: 'SCRAPER_CONTROL_ERROR'
                },
            });
        }
    },
};
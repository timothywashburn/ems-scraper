import { HistoricalScraper } from './historical-scraper';
import { ContinuousScraper } from './continuous-scraper';
import { activityLogger } from './activity-logger';

import { ScraperStats } from "@/types/scraper-types";

export class ScraperService {
    private static historicalScraper: HistoricalScraper | null = null;
    private static continuousScraper: ContinuousScraper | null = null;

    private static getHistoricalScraper(): HistoricalScraper {
        if (!ScraperService.historicalScraper) {
            ScraperService.historicalScraper = new HistoricalScraper();
        }
        return ScraperService.historicalScraper;
    }

    private static getContinuousScraper(): ContinuousScraper {
        if (!ScraperService.continuousScraper) {
            ScraperService.continuousScraper = new ContinuousScraper();
        }
        return ScraperService.continuousScraper;
    }

    static async scrapeHistoricalData(): Promise<ScraperStats> {
        return await ScraperService.getHistoricalScraper().scrapeHistoricalData();
    }

    static async startContinuousScraping(): Promise<void> {
        activityLogger.log('Starting continuous scraper', 'info');
        try {
            await ScraperService.getContinuousScraper().startContinuousScraping();
            // Only log success if still running (wasn't stopped during startup)
            if (ScraperService.getContinuousScraper().isScraperRunning()) {
                activityLogger.log('Continuous scraper started successfully', 'success');
            }
        } catch (error) {
            activityLogger.log(`Failed to start continuous scraper: ${error}`, 'error');
            throw error;
        }
    }

    static async stopContinuousScraping(): Promise<void> {
        activityLogger.log('Stopping continuous scraper', 'info');
        try {
            const result = await ScraperService.getContinuousScraper().stopContinuousScraping();
            activityLogger.log('Continuous scraper stopped successfully', 'success');
            return result;
        } catch (error) {
            activityLogger.log(`Failed to stop continuous scraper: ${error}`, 'error');
            throw error;
        }
    }

    static async getContinuousScraperStatus(): Promise<{
        isRunning: boolean;
        currentDate?: Date;
        lastUpdate?: Date;
    }> {
        return await ScraperService.getContinuousScraper().getScraperStatus();
    }
}
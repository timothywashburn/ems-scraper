import { HistoricalScraper } from './historical-scraper';
import { ContinuousScraper } from './continuous-scraper';

import { ScraperStats } from "@/types/scraper-types";

export class ScraperService {
    private historicalScraper: HistoricalScraper;
    private continuousScraper: ContinuousScraper;

    constructor() {
        this.historicalScraper = new HistoricalScraper();
        this.continuousScraper = new ContinuousScraper();
    }

    async scrapeHistoricalData(): Promise<ScraperStats> {
        return await this.historicalScraper.scrapeHistoricalData();
    }

    async startContinuousScraping(): Promise<void> {
        return await this.continuousScraper.startContinuousScraping();
    }

    async stopContinuousScraping(): Promise<void> {
        return await this.continuousScraper.stopContinuousScraping();
    }

    async getContinuousScraperStatus(): Promise<{
        isRunning: boolean;
        currentDate?: Date;
        lastUpdate?: Date;
    }> {
        return await this.continuousScraper.getScraperStatus();
    }
}
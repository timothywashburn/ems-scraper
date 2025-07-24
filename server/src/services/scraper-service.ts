import { HistoricalScraper } from './historical-scraper';
import { DailyScraper } from './daily-scraper';

import { ScraperStats } from "@/types/scraper-types";

export class ScraperService {
  private historicalScraper: HistoricalScraper;
  private dailyScraper: DailyScraper;

  constructor() {
    this.historicalScraper = new HistoricalScraper();
    this.dailyScraper = new DailyScraper();
  }

  async scrapeHistoricalData(): Promise<ScraperStats> {
    return await this.historicalScraper.scrapeHistoricalData();
  }

  async scrapeUpcoming(): Promise<ScraperStats> {
    return await this.dailyScraper.scrapeUpcoming();
  }

  async initialize(): Promise<void> {
    console.log('Initializing scraper service...');
    await this.historicalScraper.initialize();
    await this.dailyScraper.initialize();
    console.log('Scraper service initialized');
  }
}
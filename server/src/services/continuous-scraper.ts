import { ScraperClient } from './scraper-client';
import { getUpcomingEndDate } from '@/utils/date-helpers';
import { ScraperStateModel } from '@/models/scraper-state-model';
import { CONTINUOUS_SCRAPER_CONFIG } from '@/config/continuous-scraper-config';

import { ScraperStats } from "@/types/scraper-types";

export class ContinuousScraper extends ScraperClient {
  private scraperStateModel: ScraperStateModel;
  private readonly SCRAPER_TYPE = 'continuous';
  private isRunning = false;
  private shouldStop = false;

  constructor() {
    super(CONTINUOUS_SCRAPER_CONFIG);
    this.scraperStateModel = new ScraperStateModel();
  }
  private async scrapeEvents(date: Date): Promise<void> {
    try {
      const isDryRun = CONTINUOUS_SCRAPER_CONFIG.CONTINUOUS_SCRAPER_DRY_RUN;
      console.log(`\n=== Continuous scraping ${date.toISOString().split('T')[0]}${isDryRun ? ' (DRY RUN)' : ''} ===`);

      const result = await this.scrapeDay(date);

      if (result.events.length > 0) {
        if (isDryRun) {
          console.log(`🔍 DRY RUN: Would process ${result.events.length} events (no database changes made)`);
        } else {
          const batchResults = await this.eventModel.bulkUpsertEvents(result.events);
          console.log(`✓ Processed ${result.events.length} events (${batchResults.inserted} new, ${batchResults.updated} updated, ${batchResults.totalChanges} changes)`);
        }
      } else {
        console.log('✓ No events found for this date');
      }

      if (!isDryRun) {
        await this.scraperStateModel.updateScraperState(this.SCRAPER_TYPE, date);
      } else {
        console.log(`🔍 DRY RUN: Would update scraper state to ${date.toISOString().split('T')[0]}`);
      }

    } catch (error) {
      console.error(`Failed to scrape ${date.toISOString().split('T')[0]}:`, error);
      throw error;
    }
  }

  private getNextDate(currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // If we've reached 6 months from today, loop back to today
    const today = new Date();
    const sixMonthsFromToday = getUpcomingEndDate();
    
    if (nextDate > sixMonthsFromToday) {
      console.log('\n🔄 Reached end of 6-month window, looping back to today');
      return today;
    }
    
    return nextDate;
  }

  private async getStoredScrapingDate(): Promise<Date> {
    const state = await this.scraperStateModel.getScraperState(this.SCRAPER_TYPE);
    
    if (state) {
      console.log(`Resuming from last position: ${state.current_date.toISOString().split('T')[0]}`);
      return this.getNextDate(state.current_date);
    } else {
      // First time running, start from today
      const today = new Date();
      console.log(`First run detected, starting from today: ${today.toISOString().split('T')[0]}`);
      await this.scraperStateModel.initializeScraperState(this.SCRAPER_TYPE, today);
      return today;
    }
  }

  async startContinuousScraping(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Continuous scraper is already running');
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    
    const isDryRun = CONTINUOUS_SCRAPER_CONFIG.CONTINUOUS_SCRAPER_DRY_RUN;
    console.log(`🚀 Starting continuous scraper${isDryRun ? ' (DRY RUN MODE)' : ''}...`);
    console.log('📅 Will scrape 6-month rolling window continuously');
    
    let currentDate = await this.getStoredScrapingDate();

    while (!this.shouldStop) {
      try {
        await this.scrapeEvents(currentDate);
        currentDate = this.getNextDate(currentDate);

        if (!this.shouldStop) {
          const delayMs = this.calculateDynamicDelay(Date.now());
          console.log(`Waiting ${delayMs}ms before next request...`);
          await this.delay(delayMs);
        }

      } catch (error) {
        console.error(`Error in continuous scraping loop:`, error);
        console.log('Waiting 30 seconds before retrying...');
        await this.delay(30000);

        currentDate = await this.getStoredScrapingDate();
      }
    }

    this.isRunning = false;
    console.log('\n⏹️  Continuous scraper stopped');
  }

  async stopContinuousScraping(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️  Continuous scraper is not running');
      return;
    }
    
    console.log('🛑 Stopping continuous scraper...');
    this.shouldStop = true;
  }

  isScraperRunning(): boolean {
    return this.isRunning;
  }

  async getScraperStatus(): Promise<{
    isRunning: boolean;
    currentDate?: Date;
    lastUpdate?: Date;
  }> {
    const state = await this.scraperStateModel.getScraperState(this.SCRAPER_TYPE);
    
    return {
      isRunning: this.isRunning,
      currentDate: state?.current_date,
      lastUpdate: state?.updated_at
    };
  }
}
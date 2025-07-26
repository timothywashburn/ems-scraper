import { ScraperClient } from './scraper-client';
import { getUpcomingEndDate } from '@/utils/date-helpers';
import { ScraperStateModel } from '@/models/scraper-state-model';
import { CONTINUOUS_SCRAPER_CONFIG } from '@/config/continuous-scraper-config';

import { ScraperStats } from "@/types/scraper-types";
import { RawEventData, IdConverters } from "@timothyw/ems-scraper-types";

export class ContinuousScraper extends ScraperClient {
  private scraperStateModel: ScraperStateModel;
  private readonly SCRAPER_TYPE = 'continuous';
  private isRunning = false;
  private shouldStop = false;

  constructor() {
    super(CONTINUOUS_SCRAPER_CONFIG);
    this.scraperStateModel = new ScraperStateModel();
  }

  private async processEvents(events: RawEventData[], isDryRun: boolean): Promise<{
    inserted: number;
    updated: number;
    totalChanges: number;
  }> {
    let inserted = 0;
    let updated = 0;
    let totalChanges = 0;

    for (const event of events) {
      if (isDryRun) {
        const existingEvent = await this.eventModel.getEventById(IdConverters.toEventId(event.Id));
        if (existingEvent) {
          const changes = await this.eventModel.detectChanges(event, existingEvent);
          if (changes && changes.changes.length > 0) {
            console.log(`🔍 DRY RUN: Event ${event.Id} would have ${changes.changes.length} changes:`);
            this.logEventChanges(changes.changes);
            totalChanges += changes.changeCount;
            updated++;
          }
        } else {
          console.log(`🔍 DRY RUN: Event ${event.Id} would be inserted (new)`);
          inserted++;
        }
      } else {
        const result = await this.eventModel.upsertEvent(event);
        if (result.action === 'inserted') {
          inserted++;
        } else {
          updated++;
          if (result.changes && result.changes.changes.length > 0) {
            console.log(`🔄 Event ${event.Id} changed (${result.changes.changes.length} fields):`);
            this.logEventChanges(result.changes.changes);
            totalChanges += result.changes.changeCount;
          }
        }
      }
    }

    return { inserted, updated, totalChanges };
  }

  private logEventChanges(changes: any[]): void {
    for (const change of changes) {
      console.log(`   ${String(change.field)}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`);
    }
  }

  private async getEventsForDate(date: Date): Promise<any[]> {
    return await this.eventModel.getEventsForDate(date);
  }

  private async scrapeEvents(date: Date): Promise<void> {
    try {
      const isDryRun = CONTINUOUS_SCRAPER_CONFIG.CONTINUOUS_SCRAPER_DRY_RUN;
      const dateStr = date.toISOString().split('T')[0];
      console.log(`\n=== Continuous scraping ${dateStr}${isDryRun ? ' (DRY RUN)' : ''} ===`);

      // Get events that were previously found for this date
      const previouslyFoundEvents = await this.getEventsForDate(date);
      const previousEventIds = new Set(previouslyFoundEvents.map(e => e.id));

      const result = await this.scrapeDay(date);
      const eventCount = result.events.length;
      const currentEventIds = new Set(result.events.map(e => e.Id));

      if (eventCount > 0) {
        const processResults = await this.processEvents(result.events, isDryRun);
        
        const modePrefix = isDryRun ? '🔍 DRY RUN: Processed' : '✓ Processed';
        const changesSummary = processResults.totalChanges > 0 ? 
          `(${processResults.inserted} new, ${processResults.updated} updated, ${processResults.totalChanges} changes)` :
          `(${processResults.inserted} new, ${processResults.updated} updated, no changes)`;
        
        console.log(`${modePrefix} ${eventCount} events ${changesSummary}`);
        
        if (!isDryRun) {
          const eventIds = result.events.map(e => IdConverters.toEventId(e.Id));
          await this.eventModel.updateLastChecked(eventIds);
        }
      } else {
        console.log('✓ No events found for this date');
      }

      // Handle events that are no longer found
      const noLongerFoundIds = Array.from(previousEventIds).filter(id => !currentEventIds.has(id));
      const foundAgainIds = Array.from(currentEventIds).filter(id => {
        const previousEvent = previouslyFoundEvents.find(e => e.id === id);
        return previousEvent && previousEvent.no_longer_found_at !== null;
      });

      if (noLongerFoundIds.length > 0) {
        if (isDryRun) {
          console.log(`🔍 DRY RUN: Would mark ${noLongerFoundIds.length} events as no longer found: [${noLongerFoundIds.join(', ')}]`);
        } else {
          await this.eventModel.markEventsNoLongerFound(noLongerFoundIds.map(id => IdConverters.toEventId(id)));
          console.log(`❌ Marked ${noLongerFoundIds.length} events as no longer found: [${noLongerFoundIds.join(', ')}]`);
        }
      }

      if (foundAgainIds.length > 0) {
        if (isDryRun) {
          console.log(`🔍 DRY RUN: Would clear no-longer-found status for ${foundAgainIds.length} events: [${foundAgainIds.join(', ')}]`);
        } else {
          await this.eventModel.clearNoLongerFound(foundAgainIds.map(id => IdConverters.toEventId(id)));
          console.log(`✅ Cleared no-longer-found status for ${foundAgainIds.length} events: [${foundAgainIds.join(', ')}]`);
        }
      }

      if (!isDryRun) {
        await this.scraperStateModel.updateScraperState(this.SCRAPER_TYPE, date);
      } else {
        console.log(`🔍 DRY RUN: Would update scraper state to ${dateStr}`);
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
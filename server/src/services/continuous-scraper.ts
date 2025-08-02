import { ScraperClient } from './scraper-client';
import { getUpcomingEndDate } from '@/utils/date-helpers';
import { ScraperStateModel } from '@/models/scraper-state-model';
import { CONTINUOUS_SCRAPER_CONFIG } from '@/config/continuous-scraper-config';
import { IdConverters, UcsdApiEventData } from "@timothyw/ems-scraper-types";
import { EventModel } from "@/models/event-model";
import { activityLogger } from './activity-logger';

export class ContinuousScraper extends ScraperClient {
    private scraperStateModel: ScraperStateModel;
    private readonly SCRAPER_TYPE = 'continuous';
    private isRunning = false;
    private shouldStop = false;

    constructor() {
        super(CONTINUOUS_SCRAPER_CONFIG);
        this.scraperStateModel = new ScraperStateModel();
    }

    private async processEvents(events: UcsdApiEventData[]): Promise<{
        inserted: number;
        updated: number;
        newEventIds: number[];
    }> {
        let inserted = 0;
        let updated = 0;
        const newEventIds: number[] = [];

        for (const event of events) {
            const result = await EventModel.upsertEvent(event);
            if (result.action === 'inserted') {
                inserted++;
                newEventIds.push(event.Id);
            } else if (result.changes && result.changes.changes.length > 0) {
                updated++;
                console.log(`🔄 Event ${event.Id} changed (${result.changes.changes.length} fields) - archived to history:`);
                this.logEventChanges(result.changes.changes);
            }
        }

        return { inserted, updated, newEventIds };
    }

    private logEventChanges(changes: any[]): void {
        for (const change of changes) {
            console.log(`   ${String(change.field)}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`);
        }
    }

    private async getEventsForDate(date: Date): Promise<any[]> {
        return await EventModel.getEventsForDate(date);
    }

    private async scrapeEvents(date: Date): Promise<void> {
        try {
            const dateStr = date.toISOString().split('T')[0];
            console.log(`\n=== Continuous scraping ${dateStr} ===`);

            // Get events that were previously found for this date
            const previouslyFoundEvents = await this.getEventsForDate(date);
            const previousEventIds = new Set(previouslyFoundEvents.map(e => e.id));

            const result = await this.scrapeDay(date);
            const eventCount = result.events.length;
            const currentEventIds = new Set(result.events.map(e => e.Id));

            let processResults: {
                inserted: number;
                updated: number;
                newEventIds: number[];
            } = { inserted: 0, updated: 0, newEventIds: [] };
            
            if (eventCount > 0) {
                processResults = await this.processEvents(result.events);

                console.log(`✓ Processed ${eventCount} events (${processResults.inserted} new, ${processResults.updated} updated)`);
                
                if (processResults.newEventIds.length > 0) {
                    console.log(`➕ New events: [${processResults.newEventIds.join(', ')}]`);
                }

                const eventIds = result.events.map(e => IdConverters.toEventId(e.Id));
                await EventModel.updateLastChecked(eventIds);
            } else {
                console.log('✓ No events found for this date');
            }

            // Handle events that are no longer found
            const noLongerFoundIds = Array.from(previousEventIds).filter(id => !currentEventIds.has(id));
            
            // Check each current event to see if it was previously marked as "no longer found"
            // regardless of what date it was previously scheduled for
            const foundAgainIds = [];
            for (const eventId of currentEventIds) {
                const existingEvent = await EventModel.getEventById(IdConverters.toEventId(eventId));
                if (existingEvent && existingEvent.no_longer_found_at !== null) {
                    foundAgainIds.push(eventId);
                }
            }

            let actuallyMarkedCount = 0;
            if (noLongerFoundIds.length > 0) {
                actuallyMarkedCount = await EventModel.markEventsNoLongerFound(noLongerFoundIds.map(id => IdConverters.toEventId(id)));
                if (actuallyMarkedCount > 0) {
                    console.log(`❌ Marked ${actuallyMarkedCount} events as no longer found: [${noLongerFoundIds.join(', ')}]`);
                }
            }

            if (foundAgainIds.length > 0) {
                await EventModel.clearNoLongerFound(foundAgainIds.map(id => IdConverters.toEventId(id)));
                console.log(`✅ Cleared no-longer-found status for ${foundAgainIds.length} events: [${foundAgainIds.join(', ')}]`);
            }

            await this.scraperStateModel.updateScraperState(this.SCRAPER_TYPE, date);

            // Log successful scrape to activity logger
            const noLongerFoundCount = actuallyMarkedCount;
            const foundAgainCount = foundAgainIds.length;
            
            let logMessage = `Scraped ${dateStr}: ${eventCount} events`;
            if (eventCount > 0 || noLongerFoundCount > 0 || foundAgainCount > 0) {
                const parts = [];
                if (processResults.inserted > 0) parts.push(`${processResults.inserted} new`);
                if (processResults.updated > 0) parts.push(`${processResults.updated} updated`);
                if (foundAgainCount > 0) parts.push(`${foundAgainCount} found again`);
                if (noLongerFoundCount > 0) parts.push(`${noLongerFoundCount} not found`);
                
                if (parts.length > 0) {
                    logMessage += ` (${parts.join(', ')})`;
                }
            }
            
            activityLogger.log(logMessage, 'info');

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

        // Enable the scraper when starting
        await this.scraperStateModel.setScraperEnabled(this.SCRAPER_TYPE, true);

        this.isRunning = true;
        this.shouldStop = false;

        console.log('🚀 Starting continuous scraper...');
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

        // Disable the scraper when stopping
        await this.scraperStateModel.setScraperEnabled(this.SCRAPER_TYPE, false);

        console.log('🛑 Stopping continuous scraper...');
        this.shouldStop = true;
    }

    isScraperRunning(): boolean {
        return this.isRunning;
    }


    async getScraperStatus(): Promise<{
        isRunning: boolean;
        isEnabled: boolean;
        currentDate?: Date;
        lastUpdate?: Date;
    }> {
        const state = await this.scraperStateModel.getScraperState(this.SCRAPER_TYPE);

        return {
            isRunning: this.isRunning,
            isEnabled: state?.enabled ?? false,
            currentDate: state?.current_date,
            lastUpdate: state?.updated_at
        };
    }
}
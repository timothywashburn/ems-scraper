import { ScraperClient } from './scraper-client';
import { SCRAPER_CONFIG } from '@/config/scraper-config';
import { getHistoricalEndDate } from '@/utils/date-helpers';

import { ScraperStats } from "@/types/scraper-types";

export class HistoricalScraper extends ScraperClient {
  async scrapeAndPersistDateRange(startDate: Date, endDate: Date): Promise<{
    totalDays: number;
    totalEvents: number;
    inserted: number;
    updated: number;
    totalChanges: number;
    violations: string[];
  }> {
    const stats = {
      totalDays: 0,
      totalEvents: 0,
      inserted: 0,
      updated: 0,
      totalChanges: 0,
      violations: [] as string[]
    };

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      try {
        console.log(`\n=== Historical scraping ${currentDate.toISOString().split('T')[0]} ===`);

        const result = await this.scrapeDay(currentDate);
        stats.totalEvents += result.events.length;
        stats.violations.push(...result.violations);

        if (result.events.length > 0) {
          const batchResults = await this.eventModel.bulkUpsertEvents(result.events);
          stats.inserted += batchResults.inserted;
          stats.updated += batchResults.updated;
          stats.totalChanges += batchResults.totalChanges;

          // Historical mode: fail if any events were updated (should all be new)
          if (batchResults.updated > 0) {
            console.error(`❌ HISTORICAL SCRAPER STOPPED: Found ${batchResults.updated} existing events that would be updated on ${currentDate.toISOString().split('T')[0]}`);
            console.error(`This indicates the historical data range overlaps with existing data.`);
            console.error(`Please adjust HISTORICAL_START_DATE in scraper config to start after existing data.`);
            process.exit(1);
          }

          console.log(`✓ Processed ${result.events.length} events (${batchResults.inserted} new, ${batchResults.updated} updated, ${batchResults.totalChanges} changes)`);
        } else {
          console.log('✓ No events found for this date');
        }

        stats.totalDays++;

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);

        // Rate limiting delay after processing (skip on last day)
        if (currentDate <= endDate) {
          const delayMs = this.calculateDynamicDelay(result.requestStartTime);
          console.log(`Waiting ${delayMs}ms before next request...`);
          await this.delay(delayMs);
        }

      } catch (error) {
        console.error(`Failed to scrape ${currentDate.toISOString().split('T')[0]}:`, error);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return stats;
  }

  async scrapeHistoricalData(): Promise<ScraperStats> {
    console.log('🚀 Starting historical data scraping...');
    const startDate = SCRAPER_CONFIG.HISTORICAL_START_DATE;
    const endDate = getHistoricalEndDate();
    console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const result = await this.scrapeAndPersistDateRange(startDate, endDate);

    console.log('\n🎉 Historical scraping completed!');
    console.log(`📊 Summary:`);
    console.log(`   Days processed: ${result.totalDays}`);
    console.log(`   Total events: ${result.totalEvents}`);
    console.log(`   New events: ${result.inserted}`);
    console.log(`   Updated events: ${result.updated}`);
    console.log(`   Total changes: ${result.totalChanges}`);
    console.log(`   Field violations: ${result.violations.length}`);

    return result;
  }
}
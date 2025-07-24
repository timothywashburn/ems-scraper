import { EventModel } from '@/models/event-model';
import { UCSDApiResponse, RawEventData } from '@/types/event-types';
import { SCRAPER_CONFIG } from '@/config/scraper-config';
import { getHistoricalEndDate, getUpcomingEndDate } from '@/utils/date-helpers';

interface FilterData {
  filterName: string;
  value: string;
  displayValue?: string;
  filterType?: number;
}

interface EventsRequest {
  filterData: {
    filters: FilterData[];
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
}

export class ScraperService {
  private baseUrl = 'https://reservations.ucsd.edu/EmsWebApp';
  private csrfToken = '';
  private cookies = '';
  private eventModel: EventModel;

  constructor() {
    this.eventModel = new EventModel();
  }

  // Get session with retry logic
  private async getSession(retryConfig?: RetryConfig): Promise<void> {
    const retry = retryConfig || {
      maxRetries: SCRAPER_CONFIG.MAX_RETRIES,
      baseDelayMs: SCRAPER_CONFIG.BASE_DELAY_MS,
      maxDelayMs: SCRAPER_CONFIG.MAX_DELAY_MS,
      exponentialBase: SCRAPER_CONFIG.EXPONENTIAL_BACKOFF_BASE
    };

    for (let attempt = 1; attempt <= retry.maxRetries; attempt++) {
      try {
        console.log(`Getting session (attempt ${attempt}/${retry.maxRetries})...`);

        const response = await fetch(`${this.baseUrl}/BrowseEvents.aspx`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Extract cookies
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        this.cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');

        // Extract CSRF token
        const html = await response.text();
        const csrfMatch = html.match(/name="deaCSRFToken"[^>]*value="([^"]+)"/);
        if (csrfMatch) {
          this.csrfToken = csrfMatch[1];
        }

        console.log('Session established successfully');
        return;

      } catch (error) {
        console.error(`Session attempt ${attempt} failed:`, error);

        if (attempt === retry.maxRetries) {
          throw new Error(`Failed to establish session after ${retry.maxRetries} attempts: ${error}`);
        }

        // Exponential backoff
        const delayMs = Math.min(
          retry.baseDelayMs * Math.pow(retry.exponentialBase, attempt - 1),
          retry.maxDelayMs
        );
        console.log(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fetch events with retry and rate limiting
  private async fetchEventsWithRetry(startDate: Date, endDate: Date): Promise<RawEventData[]> {
    const retryConfig: RetryConfig = {
      maxRetries: SCRAPER_CONFIG.MAX_RETRIES,
      baseDelayMs: SCRAPER_CONFIG.REQUEST_DELAY_MS,
      maxDelayMs: 60000,
      exponentialBase: SCRAPER_CONFIG.EXPONENTIAL_BACKOFF_BASE
    };

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Ensure we have a valid session
        if (!this.csrfToken || !this.cookies) {
          await this.getSession();
        }

        console.log(`Fetching events ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (attempt ${attempt}/${retryConfig.maxRetries})`);

        const requestBody: EventsRequest = {
          filterData: {
            filters: [
              {
                filterName: 'StartDate',
                value: startDate.toISOString().split('T')[0] + ' 00:00:00',
                displayValue: '',
                filterType: 3,
              },
              {
                filterName: 'EndDate',
                value: endDate.toISOString().split('T')[0] + ' 00:00:00',
                filterType: 3,
                displayValue: '',
              },
              {
                filterName: 'TimeZone',
                value: '69',
                displayValue: '',
                filterType: 2,
              },
              {
                filterName: 'RollupEventsToReservation',
                value: 'false',
                displayValue: '',
              },
              {
                filterName: 'ResultType',
                value: 'Daily',
                displayValue: '',
              },
            ],
          },
        };

        const headers: Record<string, string> = {
          'accept': 'application/json, text/javascript, */*; q=0.01',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json; charset=UTF-8',
          'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-requested-with': 'XMLHttpRequest',
          'referrer': `${this.baseUrl}/BrowseEvents.aspx`,
        };

        if (this.csrfToken) {
          headers['dea-csrftoken'] = this.csrfToken;
        }

        if (this.cookies) {
          headers['cookie'] = this.cookies;
        }

        const response = await fetch(`${this.baseUrl}/ServerApi.aspx/BrowseEvents`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: UCSDApiResponse = await response.json();
        let parsedData = JSON.parse(data.d);
        console.log(parsedData)

        const events = parsedData.DailyBookingResults || parsedData.MonthlyBookingResults || [];
        console.log(`Successfully fetched ${events.length} events`);

        // Rate limiting delay
        await this.delay(SCRAPER_CONFIG.REQUEST_DELAY_MS);

        return events;

      } catch (error) {
        console.error(`Fetch attempt ${attempt} failed:`, error);

        // Reset session on auth errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          this.csrfToken = '';
          this.cookies = '';
        }

        if (attempt === retryConfig.maxRetries) {
          throw new Error(`Failed to fetch events after ${retryConfig.maxRetries} attempts: ${error}`);
        }

        // Exponential backoff
        const delayMs = Math.min(
          retryConfig.baseDelayMs * Math.pow(retryConfig.exponentialBase, attempt - 1),
          retryConfig.maxDelayMs
        );
        console.log(`Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }

    return []; // Should never reach here
  }

  // Scrape events for a single day
  async scrapeDay(date: Date): Promise<{ events: RawEventData[]; violations: string[] }> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const allEvents = await this.fetchEventsWithRetry(startDate, endDate);

    // Filter events to only include ones that start on the intended date
    // Compare dates as YYYY-MM-DD strings (PST timezone as stored)
    const targetDateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const filteredEvents = allEvents.filter(event => {
      // EventStart is already in PST format like "2001-10-07T08:00:00"
      const eventDateStr = event.EventStart.split('T')[0]; // Extract YYYY-MM-DD part
      return eventDateStr === targetDateStr;
    });

    console.log(`Filtered events: ${allEvents.length} total → ${filteredEvents.length} on target date (${targetDateStr})`);

    // Check for constant field violations
    const allViolations: string[] = [];
    for (const event of filteredEvents) {
      const violations = await this.eventModel.checkConstantFields(event);
      allViolations.push(...violations);
    }

    return { events: filteredEvents, violations: allViolations };
  }

  // Scrape and persist events for date range
  async scrapeAndPersistDateRange(startDate: Date, endDate: Date, isHistoricalMode: boolean = false): Promise<{
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
        console.log(`\n=== Scraping ${currentDate.toISOString().split('T')[0]} ===`);

        const result = await this.scrapeDay(currentDate);
        stats.totalEvents += result.events.length;
        stats.violations.push(...result.violations);

        if (result.events.length > 0) {
          // Persist events in batches
          const batchResults = await this.eventModel.bulkUpsertEvents(result.events);
          stats.inserted += batchResults.inserted;
          stats.updated += batchResults.updated;
          stats.totalChanges += batchResults.totalChanges;

          // In historical mode, stop if any events were updated (they should all be new)
          if (isHistoricalMode && batchResults.updated > 0) {
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

      } catch (error) {
        console.error(`Failed to scrape ${currentDate.toISOString().split('T')[0]}:`, error);
        // Continue with next day rather than failing entire operation
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return stats;
  }

  // Scrape historical data (Oct 1, 2001 to 1 month from today)
  async scrapeHistoricalData(): Promise<{
    totalDays: number;
    totalEvents: number;
    inserted: number;
    updated: number;
    totalChanges: number;
    violations: string[];
  }> {
    console.log('🚀 Starting historical data scraping...');
    const startDate = SCRAPER_CONFIG.HISTORICAL_START_DATE;
    const endDate = getHistoricalEndDate();
    console.log(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const result = await this.scrapeAndPersistDateRange(startDate, endDate, true);

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

  // Scrape next 6 months (for routine updates)
  async scrapeUpcoming(): Promise<{
    totalDays: number;
    totalEvents: number;
    inserted: number;
    updated: number;
    totalChanges: number;
    violations: string[];
  }> {
    const today = new Date();
    const endDate = getUpcomingEndDate();

    console.log('🔄 Starting routine upcoming events scraping...');
    console.log(`Date range: ${today.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const result = await this.scrapeAndPersistDateRange(today, endDate, false);

    console.log('\n✅ Routine scraping completed!');
    console.log(`📊 Summary:`);
    console.log(`   Days processed: ${result.totalDays}`);
    console.log(`   Total events: ${result.totalEvents}`);
    console.log(`   New events: ${result.inserted}`);
    console.log(`   Updated events: ${result.updated}`);
    console.log(`   Total changes: ${result.totalChanges}`);
    console.log(`   Field violations: ${result.violations.length}`);

    return result;
  }

  // Initialize database and schema
  async initialize(): Promise<void> {
    console.log('Initializing scraper service...');
    await this.eventModel.initializeSchema();
    console.log('Database schema initialized');
  }
}
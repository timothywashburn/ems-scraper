import { EventModel } from '@/models/event-model';
import { RawEventData, UCSDApiResponse } from '@/types/event-types';
import { EventsRequest, RetryConfig } from '@/types/scraper-types';

// Scraper client will receive config from concrete implementations

interface ScraperConfig {
    REQUEST_DELAY_MS: number;
    MIN_REQUEST_DELAY_MS: number;
    MAX_RETRIES: number;
    EXPONENTIAL_BACKOFF_BASE: number;
    BASE_DELAY_MS: number;
    MAX_DELAY_MS: number;
}

export abstract class ScraperClient {
    protected baseUrl = 'https://reservations.ucsd.edu/EmsWebApp';
    protected csrfToken = '';
    protected csrfTokenTimestamp = 0;
    protected eventModel: EventModel;
    protected config: ScraperConfig;
    private readonly CSRF_TOKEN_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

    constructor(config: ScraperConfig) {
        this.eventModel = new EventModel();
        this.config = config;
    }

    protected async getCSRFToken(): Promise<void> {
        return this.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/BrowseEvents.aspx`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Extract CSRF token
            const html = await response.text();
            const csrfMatch = html.match(/name="deaCSRFToken"[^>]*value="([^"]+)"/);
            if (csrfMatch) {
                this.csrfToken = csrfMatch[1];
            }

            this.csrfTokenTimestamp = Date.now();
            console.log('Session established successfully');
        }, 'Get CSRF token');
    }

    protected async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    protected calculateDynamicDelay(requestStartTime: number): number {
        const requestDuration = Date.now() - requestStartTime;
        const remainingDelay = Math.max(
            this.config.REQUEST_DELAY_MS - requestDuration,
            this.config.MIN_REQUEST_DELAY_MS
        );
        return remainingDelay;
    }

    protected isCSRFTokenExpired(): boolean {
        return !this.csrfToken || (Date.now() - this.csrfTokenTimestamp) > this.CSRF_TOKEN_EXPIRY_MS;
    }

    protected async withRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        shouldResetSession: (error: Error) => boolean = () => false
    ): Promise<T> {
        const retryConfig: RetryConfig = {
            maxRetries: this.config.MAX_RETRIES,
            baseDelayMs: this.config.BASE_DELAY_MS,
            maxDelayMs: this.config.MAX_DELAY_MS,
            exponentialBase: this.config.EXPONENTIAL_BACKOFF_BASE
        };

        for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.error(`${operationName} attempt ${attempt} failed:`, error);

                if (shouldResetSession(error as Error)) {
                    this.csrfToken = '';
                    this.csrfTokenTimestamp = 0;
                }

                if (attempt === retryConfig.maxRetries) {
                    throw new Error(`Failed to ${operationName.toLowerCase()} after ${retryConfig.maxRetries} attempts: ${error}`);
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

        throw new Error(`Should never reach here`);
    }

    protected async fetchEvents(date: Date, csrfToken: string): Promise<{
        events: RawEventData[];
        requestStartTime: number
    }> {
        let requestStartTime = 0;

        return this.withRetry(async () => {
                const startDate = date;
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + 1);

                console.log(`Fetching events for ${startDate.toISOString().split('T')[0]}`);

                requestStartTime = Date.now();

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
                    'dea-csrftoken': csrfToken,
                };


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

                const events = parsedData.DailyBookingResults || parsedData.MonthlyBookingResults || [];
                console.log(`Successfully fetched ${events.length} events`);

                return { events, requestStartTime };
            },
            'Fetch events',
            (error: Error) => error.message.includes('401') || error.message.includes('403'));
    }

    async scrapeDay(date: Date): Promise<{ events: RawEventData[]; violations: string[]; requestStartTime: number }> {
        // Ensure we have a valid CSRF token
        if (this.isCSRFTokenExpired()) {
            await this.getCSRFToken();
        }

        const fetchResult = await this.fetchEvents(date, this.csrfToken);
        const allEvents = fetchResult.events;

        // Filter events to only include ones that start on the intended date
        const targetDateStr = date.toISOString().split('T')[0];
        const filteredEvents = allEvents.filter(event => {
            const eventDateStr = event.EventStart.split('T')[0];
            return eventDateStr === targetDateStr;
        });

        console.log(`Filtered events: ${allEvents.length} total → ${filteredEvents.length} on target date (${targetDateStr})`);

        // Check for constant field violations
        const allViolations: string[] = [];
        for (const event of filteredEvents) {
            const violations = await this.eventModel.checkConstantFields(event);
            allViolations.push(...violations);
        }

        return { events: filteredEvents, violations: allViolations, requestStartTime: fetchResult.requestStartTime };
    }
}
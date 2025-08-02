// Historical scraper configuration constants
export const HISTORICAL_SCRAPER_CONFIG = {
    // Enable/disable flag
    RUN_HISTORICAL_SCRAPER: false,

    // Date range settings
    // HISTORICAL_START_DATE: new Date('2001-10-01'),
    HISTORICAL_START_DATE: new Date('2001-10-08'),

    // Rate limiting settings (can be overridden per scraper)
    REQUEST_DELAY_MS: 2000,
    MIN_REQUEST_DELAY_MS: 1000,
    MAX_RETRIES: 8,
    EXPONENTIAL_BACKOFF_BASE: 1.5,

    // Request timeout settings (can be overridden per scraper)
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 30000,
} as const;
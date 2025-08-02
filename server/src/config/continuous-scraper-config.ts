// Continuous scraper configuration constants
export const CONTINUOUS_SCRAPER_CONFIG = {
    // Rate limiting settings (can be overridden per scraper)
    REQUEST_DELAY_MS: 5000,
    MIN_REQUEST_DELAY_MS: 1000,
    MAX_RETRIES: 8,
    EXPONENTIAL_BACKOFF_BASE: 1.5,

    // Request timeout settings (can be overridden per scraper)
    BASE_DELAY_MS: 1000,
    MAX_DELAY_MS: 30000,
} as const;
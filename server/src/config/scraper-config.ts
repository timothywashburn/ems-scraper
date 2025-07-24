// Scraper configuration constants
export const SCRAPER_CONFIG = {
  // Scraper enable/disable flags
  RUN_HISTORICAL_SCRAPER: true,
  RUN_UPCOMING_SCRAPER: false,
  
  // Rate limiting settings
  // REQUEST_DELAY_MS: 4000,
  REQUEST_DELAY_MS: 2000,
  MAX_RETRIES: 8,
  EXPONENTIAL_BACKOFF_BASE: 1.5,
  
  // Date range settings
  // HISTORICAL_START_DATE: new Date('2001-10-01'),
  HISTORICAL_START_DATE: new Date('2001-10-08'),

  // Database persistence settings
  BATCH_SIZE: 100,
  CHECKPOINT_INTERVAL: 10,
  
  // Request timeout settings
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
} as const;
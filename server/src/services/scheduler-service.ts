import { ScraperService } from './scraper-service';

export class SchedulerService {
  private scraper: ScraperService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.scraper = new ScraperService();
  }

  // Start routine scraping (twice daily)
  async startRoutineSchedule(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Scheduler already running');
      return;
    }

    console.log('🕐 Starting routine scraping schedule (every 12 hours)');
    
    // Initialize scraper
    await this.scraper.initialize();
    
    // Run immediately once
    await this.runRoutineScrape();
    
    // Schedule every 12 hours (twice daily)
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    this.intervalId = setInterval(async () => {
      await this.runRoutineScrape();
    }, TWELVE_HOURS_MS);
    
    this.isRunning = true;
    console.log('✅ Routine scraping schedule started');
  }

  // Stop routine scraping
  stopRoutineSchedule(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Routine scraping schedule stopped');
  }

  // Run a single routine scrape
  private async runRoutineScrape(): Promise<void> {
    try {
      console.log('\n🔄 Running scheduled routine scrape...');
      const startTime = Date.now();
      
      const stats = await this.scraper.scrapeUpcoming();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Routine scrape completed in ${duration}s`);
      console.log(`📊 Stats: ${stats.inserted} new, ${stats.updated} updated, ${stats.totalChanges} changes`);
      
      if (stats.violations.length > 0) {
        console.warn(`⚠️  ${stats.violations.length} constant field violations detected`);
        stats.violations.slice(0, 5).forEach(violation => console.warn(`   ${violation}`));
      }
      
    } catch (error) {
      console.error('❌ Routine scrape failed:', error);
      // Don't throw - let the schedule continue
    }
  }

  // Get scheduler status
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    if (!this.isRunning) {
      return { isRunning: false };
    }

    // Estimate next run time (12 hours from when we started)
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 12);
    
    return {
      isRunning: true,
      nextRun
    };
  }

  // Manual trigger for testing
  async triggerManualScrape(): Promise<{
    totalDays: number;
    totalEvents: number;
    inserted: number;
    updated: number;
    totalChanges: number;
    violations: string[];
  }> {
    console.log('🔧 Manual scrape triggered');
    return await this.scraper.scrapeUpcoming();
  }
}
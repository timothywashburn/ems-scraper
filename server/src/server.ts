import express from 'express';
import cors from 'cors';
import ApiManager from '@/controllers/api-manager';
import { prisma } from '@/lib/prisma';
import { ScraperService } from '@/services/scraper-service';
import { HISTORICAL_SCRAPER_CONFIG } from '@/config/historical-scraper-config';
import { TokenService } from '@/services/token-service';
import { scriptManager } from '@/controllers/script-manager';

const app = express();
const PORT = 3100;

app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        // Test Prisma connection
        await prisma.$connect();
        console.log('Prisma connected successfully');

        // Ensure initial API token exists
        await TokenService.getInstance().ensureInitialTokenExists();

        // Run scripts for empty tables (can be disabled for manual control)
        // await scriptManager.runAllScriptsIfEmpty();

        // Run scrapers based on config constants
        if (HISTORICAL_SCRAPER_CONFIG.RUN_HISTORICAL_SCRAPER) {
            console.log('🚀 Starting historical scraper...');
            ScraperService.scrapeHistoricalData()
                .then(stats => {
                    console.log('✅ Historical scraping completed:', stats);
                })
                .catch(error => {
                    console.error('❌ Historical scraping failed:', error);
                });
        }

        app.use(ApiManager.getInstance().getRouter());

        app.listen(PORT, () => {
            console.log(`EMS Scraper server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
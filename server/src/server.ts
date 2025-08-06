import express from 'express';
import cors from 'cors';
import ApiManager from '@/controllers/api-manager';
import { prisma } from '@/lib/prisma';
import { ScraperService } from '@/services/scraper-service';
import { HISTORICAL_SCRAPER_CONFIG } from '@/config/historical-scraper-config';
import { TokenService } from '@/services/token-service';
import { scriptManager } from '@/controllers/script-manager';
import { ScraperStateModel } from '@/models/scraper-state-model';

const app = express();
const PORT = 3100;

app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Prisma connected successfully');

        await TokenService.getInstance().ensureInitialTokenExists();

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

        const isContinuousScraperEnabled = await ScraperStateModel.isScraperEnabled('continuous');
        if (isContinuousScraperEnabled) {
            console.log('🚀 Auto-starting continuous scraper (was previously enabled)...');
            ScraperService.startContinuousScraping()
                .then(() => {
                    console.log('✅ Continuous scraper auto-started successfully');
                })
                .catch(error => {
                    console.error('❌ Failed to auto-start continuous scraper:', error);
                });
        } else {
            console.log('ℹ️ Continuous scraper not auto-started');
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

startServer().then();
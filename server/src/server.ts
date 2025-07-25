import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ApiManager from '@/controllers/api-manager';
import { prisma } from '@/lib/prisma';
import { ScraperService } from '@/services/scraper-service';
import { SCRAPER_CONFIG } from '@/config/scraper-config';

dotenv.config({ path: ['.env', '.env.local'] });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
    try {
        // Test Prisma connection
        await prisma.$connect();
        console.log('Prisma connected successfully');
        
        // Initialize scraper service
        const scraper = new ScraperService();
        await scraper.initialize();
        
        // Run scrapers based on config constants
        if (SCRAPER_CONFIG.RUN_HISTORICAL_SCRAPER) {
            console.log('🚀 Starting historical scraper...');
            scraper.scrapeHistoricalData()
                .then(stats => {
                    console.log('✅ Historical scraping completed:', stats);
                })
                .catch(error => {
                    console.error('❌ Historical scraping failed:', error);
                });
        }
        
        if (SCRAPER_CONFIG.RUN_UPCOMING_SCRAPER) {
            console.log('🔄 Starting upcoming scraper...');
            scraper.scrapeUpcoming()
                .then(stats => {
                    console.log('✅ Upcoming scraping completed:', stats);
                })
                .catch(error => {
                    console.error('❌ Upcoming scraping failed:', error);
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
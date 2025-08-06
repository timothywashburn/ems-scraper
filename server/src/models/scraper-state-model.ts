import { prisma } from '@/lib/prisma';
import { scraper_state } from '@prisma/client';

export class ScraperStateModel {
    private constructor() {
    }

    static async getScraperState(scraperType: string): Promise<scraper_state | null> {
        return prisma.scraper_state.findUnique({
            where: { scraper_type: scraperType }
        });
    }

    static async updateScraperState(scraperType: string, currentDate: Date): Promise<void> {
        await prisma.scraper_state.upsert({
            where: { scraper_type: scraperType },
            update: {
                current_date: currentDate,
                updated_at: new Date()
            },
            create: {
                scraper_type: scraperType,
                current_date: currentDate,
                enabled: false, // Default to disabled
                updated_at: new Date()
            }
        });
    }

    static async initializeScraperState(scraperType: string, startDate: Date): Promise<void> {
        const existing = await ScraperStateModel.getScraperState(scraperType);
        if (!existing) {
            await ScraperStateModel.updateScraperState(scraperType, startDate);
        }
    }

    static async isScraperEnabled(scraperType: string): Promise<boolean> {
        const state = await ScraperStateModel.getScraperState(scraperType);
        return state?.enabled ?? false;
    }

    static async setScraperEnabled(scraperType: string, enabled: boolean): Promise<void> {
        const existing = await ScraperStateModel.getScraperState(scraperType);

        if (existing) {
            await prisma.scraper_state.update({
                where: { scraper_type: scraperType },
                data: {
                    enabled: enabled,
                    updated_at: new Date()
                }
            });
        } else {
            // Initialize with current date if doesn't exist
            const today = new Date();
            await prisma.scraper_state.create({
                data: {
                    scraper_type: scraperType,
                    current_date: today,
                    enabled: enabled,
                    updated_at: new Date()
                }
            });
        }
    }
}
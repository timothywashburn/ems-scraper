import { prisma } from '@/lib/prisma';
import { scraper_state } from '@prisma/client';

export class ScraperStateModel {
    constructor() {
    }

    async getScraperState(scraperType: string): Promise<scraper_state | null> {
        return await prisma.scraper_state.findUnique({
            where: { scraper_type: scraperType }
        });
    }

    async updateScraperState(scraperType: string, currentDate: Date): Promise<void> {
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

    async initializeScraperState(scraperType: string, startDate: Date): Promise<void> {
        const existing = await this.getScraperState(scraperType);
        if (!existing) {
            await this.updateScraperState(scraperType, startDate);
        }
    }

    async isScraperEnabled(scraperType: string): Promise<boolean> {
        const state = await this.getScraperState(scraperType);
        return state?.enabled ?? false; // Default to false if no state exists
    }

    async setScraperEnabled(scraperType: string, enabled: boolean): Promise<void> {
        const existing = await this.getScraperState(scraperType);

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
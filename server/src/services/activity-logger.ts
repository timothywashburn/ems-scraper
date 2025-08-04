interface ActivityEntry {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'error';
}

export class ActivityLogger {
    private static instance: ActivityLogger | null = null;
    private activities: ActivityEntry[] = [];
    private maxEntries = 100; // Keep last 100 entries

    private constructor() {
    }

    static getInstance(): ActivityLogger {
        if (!ActivityLogger.instance) {
            ActivityLogger.instance = new ActivityLogger();
        }
        return ActivityLogger.instance;
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    log(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
        const entry: ActivityEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            message,
            type,
        };

        this.activities.unshift(entry); // Add to beginning

        // Keep only the most recent entries
        if (this.activities.length > this.maxEntries) {
            this.activities = this.activities.slice(0, this.maxEntries);
        }

        // Also log to console for debugging
        const logMethod = type === 'error' ? console.error : type === 'success' ? console.log : console.info;
        logMethod(`[${entry.timestamp.toISOString()}] ${message}`);
    }

    getRecentActivities(limit: number = 20): ActivityEntry[] {
        return this.activities.slice(0, limit);
    }

    clear(): void {
        this.activities = [];
    }
}

export const activityLogger = ActivityLogger.getInstance();
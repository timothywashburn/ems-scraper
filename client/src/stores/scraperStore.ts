import { create } from 'zustand';

interface ScraperOverview {
    isRunning: boolean;
    currentDate?: string;
    lastUpdate?: string;
    totalEvents: number;
    eventsToday: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
    lastEventUpdate: string | null;
}

interface ActivityLogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface ScraperState {
    // Data
    overview: ScraperOverview | null;
    activities: ActivityLogEntry[];
    lastRefresh: Date;

    // Loading states
    overviewLoading: boolean;
    logsLoading: boolean;

    // Error states
    overviewError: string | null;
    logsError: string | null;

    // Polling control
    isPolling: boolean;
    pollingInterval: number | null;

    // Actions
    setOverview: (overview: ScraperOverview | null) => void;
    setActivities: (activities: ActivityLogEntry[]) => void;
    setOverviewLoading: (loading: boolean) => void;
    setLogsLoading: (loading: boolean) => void;
    setOverviewError: (error: string | null) => void;
    setLogsError: (error: string | null) => void;
    setLastRefresh: (date: Date) => void;

    // Async actions
    fetchScraperOverview: (token: string) => Promise<void>;
    fetchScraperLogs: (token: string) => Promise<void>;
    fetchAll: (token: string) => Promise<void>;
    controlScraper: (token: string, action: 'start' | 'stop') => Promise<void>;

    // Polling control
    startPolling: (token: string) => void;
    stopPolling: () => void;
}

export const useScraperStore = create<ScraperState>((set, get) => ({
    // Initial state
    overview: null,
    activities: [],
    lastRefresh: new Date(),
    overviewLoading: true,
    logsLoading: true,
    overviewError: null,
    logsError: null,
    isPolling: false,
    pollingInterval: null,

    // Basic setters
    setOverview: (overview) => set({ overview }),
    setActivities: (activities) => set({ activities }),
    setOverviewLoading: (overviewLoading) => set({ overviewLoading }),
    setLogsLoading: (logsLoading) => set({ logsLoading }),
    setOverviewError: (overviewError) => set({ overviewError }),
    setLogsError: (logsError) => set({ logsError }),
    setLastRefresh: (lastRefresh) => set({ lastRefresh }),

    // Async actions
    fetchScraperOverview: async (token: string) => {
        try {
            const response = await fetch('/api/scraper/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                get().setOverview(result.data);
                get().setOverviewError(null);
            } else {
                get().setOverviewError(result.error?.message || 'Failed to fetch overview');
            }
        } catch (error) {
            get().setOverviewError('Network error');
            console.error('Failed to fetch scraper overview:', error);
        } finally {
            get().setOverviewLoading(false);
        }
    },

    fetchScraperLogs: async (token: string) => {
        try {
            const response = await fetch('/api/scraper/logs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success) {
                get().setActivities(result.data.activities);
                get().setLogsError(null);
            } else {
                get().setLogsError(result.error?.message || 'Failed to fetch logs');
            }
        } catch (error) {
            get().setLogsError('Network error');
            console.error('Failed to fetch scraper logs:', error);
        } finally {
            get().setLogsLoading(false);
        }
    },

    fetchAll: async (token: string) => {
        await Promise.all([
            get().fetchScraperOverview(token),
            get().fetchScraperLogs(token)
        ]);
        get().setLastRefresh(new Date());
    },

    controlScraper: async (token: string, action: 'start' | 'stop') => {
        try {
            const response = await fetch('/api/scraper/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });

            const result = await response.json();

            if (result.success) {
                // Refresh data immediately after control action
                await get().fetchAll(token);
            } else {
                console.error('Scraper control failed:', result.error?.message);
            }
        } catch (error) {
            console.error('Scraper control error:', error);
        }
    },

    // Polling control
    startPolling: (token: string) => {
        if (get().isPolling) return;

        // Initial fetch
        get().fetchAll(token);

        // Start polling every 2 seconds
        const interval = setInterval(() => {
            get().fetchAll(token);
        }, 2000);

        set({ isPolling: true, pollingInterval: interval });
    },

    stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
            clearInterval(pollingInterval);
            set({ isPolling: false, pollingInterval: null });
        }
    },
}));
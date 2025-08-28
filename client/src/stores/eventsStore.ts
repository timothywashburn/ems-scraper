import { create } from 'zustand';

interface NoLongerFoundEvent {
    id: string;
    event_name: string;
    event_start: string;
    event_end: string;
    building: string;
    room: string;
    group_name: string;
    no_longer_found_at: string;
}

interface RecentArchive {
    history_id: number;
    id: number; // This is the event_id
    version_number: number;
    change_count: number;
    archived_at: string;
    last_checked: string;
    event_name: string;
    event_start: string;
    event_end: string;
    gmt_start: string;
    gmt_end: string;
    time_booking_start: string;
    time_booking_end: string;
    is_all_day_event: boolean;
    timezone_abbreviation: string;
    building: string;
    building_id: number;
    room: string;
    room_id: number;
    room_code: string;
    room_type: string;
    room_type_id: number;
    location: string;
    location_link: string;
    group_name: string;
    reservation_id: number;
    reservation_summary_url: string;
    status_id: number;
    status_type_id: number;
    web_user_is_owner: boolean;
}

interface NewEvent {
    id: string;
    event_name: string;
    event_start: string;
    event_end: string;
    building: string;
    room: string;
    group_name: string;
    created_at: string;
}

interface EventsState {
    // Data
    noLongerFoundEvents: NoLongerFoundEvent[];
    recentArchives: RecentArchive[];
    newEvents: NewEvent[];
    lastRefresh: Date;

    // Loading states
    isLoading: boolean;
    recentArchivesLoading: boolean;
    newEventsLoading: boolean;

    // Error states
    error: string | null;
    recentArchivesError: string | null;
    newEventsError: string | null;

    // Polling control
    isPolling: boolean;
    pollingInterval: number | null;

    // Actions
    setNoLongerFoundEvents: (events: NoLongerFoundEvent[]) => void;
    setRecentArchives: (changes: RecentArchive[]) => void;
    setNewEvents: (events: NewEvent[]) => void;
    setLoading: (loading: boolean) => void;
    setRecentArchivesLoading: (loading: boolean) => void;
    setNewEventsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setRecentArchivesError: (error: string | null) => void;
    setNewEventsError: (error: string | null) => void;
    setLastRefresh: (date: Date) => void;

    // Async actions
    fetchNoLongerFoundEvents: (token: string) => Promise<void>;
    fetchRecentArchives: (token: string) => Promise<void>;
    fetchNewEvents: (token: string) => Promise<void>;

    // Polling control
    startPolling: (token: string) => void;
    stopPolling: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
    // Initial state
    noLongerFoundEvents: [],
    recentArchives: [],
    newEvents: [],
    lastRefresh: new Date(),
    isLoading: true,
    recentArchivesLoading: true,
    newEventsLoading: true,
    error: null,
    recentArchivesError: null,
    newEventsError: null,
    isPolling: false,
    pollingInterval: null,

    // Basic setters
    setNoLongerFoundEvents: (noLongerFoundEvents) => set({ noLongerFoundEvents }),
    setRecentArchives: (recentArchives) => set({ recentArchives }),
    setNewEvents: (newEvents) => set({ newEvents }),
    setLoading: (isLoading) => set({ isLoading }),
    setRecentArchivesLoading: (recentArchivesLoading) => set({ recentArchivesLoading }),
    setNewEventsLoading: (newEventsLoading) => set({ newEventsLoading }),
    setError: (error) => set({ error }),
    setRecentArchivesError: (recentArchivesError) => set({ recentArchivesError }),
    setNewEventsError: (newEventsError) => set({ newEventsError }),
    setLastRefresh: (lastRefresh) => set({ lastRefresh }),

    // Async actions
    fetchNoLongerFoundEvents: async (token: string) => {
        try {
            const response = await fetch('/api/events/missing?limit=20', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success && result.data) {
                get().setNoLongerFoundEvents(result.data.events);
                get().setError(null);
            } else {
                get().setError(result.error?.message || 'Failed to fetch events');
            }
        } catch (error) {
            get().setError('Network error');
            console.error('Failed to fetch no longer found events:', error);
        } finally {
            get().setLoading(false);
        }
    },

    fetchRecentArchives: async (token: string) => {
        try {
            const response = await fetch('/api/events/recent-archives?limit=20', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success && result.data) {
                get().setRecentArchives(result.data.changes);
                get().setRecentArchivesError(null);
            } else {
                get().setRecentArchivesError(result.error?.message || 'Failed to fetch recent archives');
            }
        } catch (error) {
            get().setRecentArchivesError('Network error');
            console.error('Failed to fetch recent archives:', error);
        } finally {
            get().setRecentArchivesLoading(false);
        }
    },

    fetchNewEvents: async (token: string) => {
        try {
            const response = await fetch('/api/events/new?limit=20', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (result.success && result.data) {
                get().setNewEvents(result.data.events);
                get().setNewEventsError(null);
            } else {
                get().setNewEventsError(result.error?.message || 'Failed to fetch new events');
            }
        } catch (error) {
            get().setNewEventsError('Network error');
            console.error('Failed to fetch new events:', error);
        } finally {
            get().setNewEventsLoading(false);
        }
    },

    // Polling control
    startPolling: (token: string) => {
        if (get().isPolling) return;

        // Initial fetch
        const fetchData = async () => {
            await Promise.all([
                get().fetchNoLongerFoundEvents(token),
                get().fetchRecentArchives(token),
                get().fetchNewEvents(token)
            ]);
            get().setLastRefresh(new Date());
        };

        fetchData();

        // Start polling every 5 seconds
        const interval = setInterval(fetchData, 5000);

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
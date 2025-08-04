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

interface RecentChange {
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

interface EventsState {
  // Data
  noLongerFoundEvents: NoLongerFoundEvent[];
  recentChanges: RecentChange[];
  lastRefresh: Date;
  
  // Loading states
  isLoading: boolean;
  recentChangesLoading: boolean;
  
  // Error states
  error: string | null;
  recentChangesError: string | null;
  
  // Polling control
  isPolling: boolean;
  pollingInterval: number | null;
  
  // Actions
  setNoLongerFoundEvents: (events: NoLongerFoundEvent[]) => void;
  setRecentChanges: (changes: RecentChange[]) => void;
  setLoading: (loading: boolean) => void;
  setRecentChangesLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRecentChangesError: (error: string | null) => void;
  setLastRefresh: (date: Date) => void;
  
  // Async actions
  fetchNoLongerFoundEvents: (token: string) => Promise<void>;
  fetchRecentChanges: (token: string) => Promise<void>;
  
  // Polling control
  startPolling: (token: string) => void;
  stopPolling: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  // Initial state
  noLongerFoundEvents: [],
  recentChanges: [],
  lastRefresh: new Date(),
  isLoading: true,
  recentChangesLoading: true,
  error: null,
  recentChangesError: null,
  isPolling: false,
  pollingInterval: null,
  
  // Basic setters
  setNoLongerFoundEvents: (noLongerFoundEvents) => set({ noLongerFoundEvents }),
  setRecentChanges: (recentChanges) => set({ recentChanges }),
  setLoading: (isLoading) => set({ isLoading }),
  setRecentChangesLoading: (recentChangesLoading) => set({ recentChangesLoading }),
  setError: (error) => set({ error }),
  setRecentChangesError: (recentChangesError) => set({ recentChangesError }),
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

  fetchRecentChanges: async (token: string) => {
    try {
      const response = await fetch('/api/events/recent-changes?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        get().setRecentChanges(result.data.changes);
        get().setRecentChangesError(null);
      } else {
        get().setRecentChangesError(result.error?.message || 'Failed to fetch recent changes');
      }
    } catch (error) {
      get().setRecentChangesError('Network error');
      console.error('Failed to fetch recent changes:', error);
    } finally {
      get().setRecentChangesLoading(false);
    }
  },
  
  // Polling control
  startPolling: (token: string) => {
    if (get().isPolling) return;
    
    // Initial fetch
    const fetchData = async () => {
      await Promise.all([
        get().fetchNoLongerFoundEvents(token),
        get().fetchRecentChanges(token)
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
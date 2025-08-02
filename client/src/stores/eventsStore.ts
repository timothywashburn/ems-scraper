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

interface EventsState {
  // Data
  noLongerFoundEvents: NoLongerFoundEvent[];
  lastRefresh: Date;
  
  // Loading states
  isLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Polling control
  isPolling: boolean;
  pollingInterval: number | null;
  
  // Actions
  setNoLongerFoundEvents: (events: NoLongerFoundEvent[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastRefresh: (date: Date) => void;
  
  // Async actions
  fetchNoLongerFoundEvents: (token: string) => Promise<void>;
  
  // Polling control
  startPolling: (token: string) => void;
  stopPolling: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  // Initial state
  noLongerFoundEvents: [],
  lastRefresh: new Date(),
  isLoading: true,
  error: null,
  isPolling: false,
  pollingInterval: null,
  
  // Basic setters
  setNoLongerFoundEvents: (noLongerFoundEvents) => set({ noLongerFoundEvents }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  
  // Async actions
  fetchNoLongerFoundEvents: async (token: string) => {
    try {
      const response = await fetch('/api/events/missing?limit=100', {
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
  
  // Polling control
  startPolling: (token: string) => {
    if (get().isPolling) return;
    
    // Initial fetch
    const fetchData = async () => {
      await get().fetchNoLongerFoundEvents(token);
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
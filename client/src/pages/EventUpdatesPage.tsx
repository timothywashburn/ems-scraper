import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEventsStore } from '../stores/eventsStore';
import { Calendar, AlertTriangle, Clock, MapPin } from 'lucide-react';

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

interface NoLongerFoundEventsResponse {
  success: boolean;
  data?: {
    count: number;
    events: NoLongerFoundEvent[];
  };
  error?: {
    message: string;
    code: string;
  };
}

export const EventUpdatesPage: React.FC = () => {
  const { user } = useAuth();
  const {
    noLongerFoundEvents,
    isLoading,
    error,
    lastRefresh,
    startPolling,
    stopPolling
  } = useEventsStore();

  useEffect(() => {
    if (user?.token) {
      startPolling(user.token);
    }

    return () => {
      stopPolling();
    };
  }, [user?.token, startPolling, stopPolling]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric'
      });
    };

    return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Event Updates</h2>
        <div className="text-xs text-gray-400">
          Last refresh: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 5s
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - History Information (Placeholder) */}
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Event History Overview</h3>
          <div className="text-center text-gray-400 mt-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p>Historical data visualization coming soon...</p>
            <p className="text-sm mt-2">
              This will show trends, change patterns, and statistical insights about event modifications over time.
            </p>
          </div>
        </div>

        {/* Right Panel - No Longer Found Events */}
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
            Events No Longer Found ({noLongerFoundEvents.length})
          </h3>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-400">{error}</div>
            </div>
          ) : noLongerFoundEvents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>No events marked as no longer found</p>
                <p className="text-sm mt-2">
                  Events that disappear from the source will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3">
              {noLongerFoundEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white text-sm leading-tight">
                      {event.event_name}
                    </h4>
                    <span className="text-xs text-orange-400 font-medium ml-2 flex-shrink-0">
                      {formatTimeAgo(event.no_longer_found_at)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-300">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      {formatEventTime(event.event_start, event.event_end)}
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {event.building} - {event.room}
                    </div>
                    
                    {event.group_name && (
                      <div className="text-gray-400">
                        Group: {event.group_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Event ID: {event.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
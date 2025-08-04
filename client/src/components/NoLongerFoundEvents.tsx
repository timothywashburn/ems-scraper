import React from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { useEventsStore } from '../stores/eventsStore';
import { EventCard } from './EventCard';

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

interface Props {
    onEventClick?: (eventId: string) => void;
}

export const NoLongerFoundEvents: React.FC<Props> = ({ onEventClick }) => {
    const {
        noLongerFoundEvents,
        isLoading,
        error,
    } = useEventsStore();

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

    return (
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
                        <EventCard
                            key={event.id}
                            eventId={event.id}
                            eventName={event.event_name}
                            eventStart={event.event_start}
                            eventEnd={event.event_end}
                            building={event.building}
                            room={event.room}
                            groupName={event.group_name}
                            statusLine={formatTimeAgo(event.no_longer_found_at)}
                            statusColor="orange"
                            onClick={onEventClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
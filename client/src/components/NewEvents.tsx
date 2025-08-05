import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useEventsStore } from '../stores/eventsStore';
import { EventCard } from './EventCard';

interface Props {
    onEventClick?: (eventId: string) => void;
}

export const NewEvents: React.FC<Props> = ({ onEventClick }) => {
    const {
        newEvents,
        newEventsLoading,
        newEventsError,
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
                <Plus className="w-5 h-5 mr-2 text-green-400" />
                New Events ({newEvents.length})
            </h3>

            {newEventsLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-400">Loading new events...</div>
                </div>
            ) : newEventsError ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-400">{newEventsError}</div>
                </div>
            ) : newEvents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p>No new events</p>
                        <p className="text-sm mt-2">
                            Recently added events will appear here.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {newEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            eventId={event.id}
                            eventName={event.event_name}
                            eventStart={event.event_start}
                            eventEnd={event.event_end}
                            building={event.building}
                            room={event.room}
                            groupName={event.group_name}
                            statusLine={formatTimeAgo(event.created_at)}
                            statusColor="purple"
                            bottomLine="New event"
                            onClick={onEventClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
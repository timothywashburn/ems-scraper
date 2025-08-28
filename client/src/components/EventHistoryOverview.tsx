import React from 'react';
import { Activity, Calendar } from 'lucide-react';
import { useEventsStore } from '../stores/eventsStore';
import { EventCard } from './EventCard';

interface Props {
    onEventClick?: (eventId: string) => void;
}

export const EventHistoryOverview: React.FC<Props> = ({ onEventClick }) => {
    const {
        recentArchives,
        recentArchivesLoading,
        recentArchivesError,
    } = useEventsStore();

    const formatTimeWindow = (lastChecked: string, archivedAt: string) => {
        const lastCheckedDate = new Date(lastChecked);
        const archivedDate = new Date(archivedAt);
        const now = new Date();

        // Calculate how long ago the window ended
        const diffMs = now.getTime() - archivedDate.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo;
        if (diffDays > 0) {
            timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
            timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            timeAgo = 'Just now';
        }

        // Calculate the window duration
        const windowMs = archivedDate.getTime() - lastCheckedDate.getTime();
        const windowMinutes = Math.floor(windowMs / (1000 * 60));
        const windowHours = Math.floor(windowMinutes / 60);
        const windowDays = Math.floor(windowHours / 24);

        let windowDuration;
        if (windowDays > 0) {
            const remainingHours = windowHours % 24;
            if (remainingHours > 0) {
                windowDuration = `${windowDays}d ${remainingHours}h window`;
            } else {
                windowDuration = `${windowDays}d window`;
            }
        } else if (windowHours > 0) {
            windowDuration = `${windowHours}h window`;
        } else if (windowMinutes > 0) {
            windowDuration = `${windowMinutes}m window`;
        } else {
            windowDuration = '<1m window';
        }

        return `${timeAgo} (${windowDuration})`;
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Recent Archives ({recentArchives.length})
            </h3>

            {recentArchivesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-400">Loading recent archives...</div>
                </div>
            ) : recentArchivesError ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-400">{recentArchivesError}</div>
                </div>
            ) : recentArchives.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p>No recent event archives</p>
                        <p className="text-sm mt-2">
                            Recently archived event versions will appear here.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {recentArchives.map((archive, index) => (
                        <EventCard
                            key={`${archive.id || 'unknown'}-${archive.version_number}-${index}`}
                            eventId={archive.id?.toString() || 'unknown'}
                            eventName={archive.event_name}
                            eventStart={archive.event_start}
                            eventEnd={archive.event_end}
                            building={archive.building}
                            room={archive.room}
                            groupName={archive.group_name}
                            statusLine={formatTimeWindow(archive.last_checked, archive.archived_at)}
                            statusColor="blue"
                            bottomLine={`${archive.change_count} change${archive.change_count !== 1 ? 's' : ''} • Archived Version ${archive.version_number}`}
                            onClick={onEventClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
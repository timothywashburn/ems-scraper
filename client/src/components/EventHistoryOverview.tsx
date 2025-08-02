import React from 'react';
import { Calendar, Activity } from 'lucide-react';
import { useEventsStore } from '../stores/eventsStore';
import { EventCard } from './EventCard';

interface Props {
  onEventClick?: (eventId: string) => void;
}

export const EventHistoryOverview: React.FC<Props> = ({ onEventClick }) => {
  const {
    recentChanges,
    recentChangesLoading,
    recentChangesError,
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
        <Activity className="w-5 h-5 mr-2 text-blue-400" />
        Recent Changes ({recentChanges.length})
      </h3>

      {recentChangesLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading recent changes...</div>
        </div>
      ) : recentChangesError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">{recentChangesError}</div>
        </div>
      ) : recentChanges.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p>No recent event changes</p>
            <p className="text-sm mt-2">
              Recent event modifications will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {recentChanges.map((change, index) => (
            <EventCard
              key={`${change.id || 'unknown'}-${change.version_number}-${index}`}
              eventId={change.id?.toString() || 'unknown'}
              eventName={change.event_name}
              eventStart={change.event_start}
              eventEnd={change.event_end}
              building={change.building}
              room={change.room}
              groupName={change.group_name}
              statusLine={formatTimeAgo(change.archived_at)}
              statusColor="blue"
              bottomLine={`${change.change_count} change${change.change_count !== 1 ? 's' : ''} • Version ${change.version_number}`}
              onClick={onEventClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
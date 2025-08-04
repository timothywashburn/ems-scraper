import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEventsStore } from '../stores/eventsStore';
import { EventHistoryOverview } from '../components/EventHistoryOverview';
import { NoLongerFoundEvents } from '../components/NoLongerFoundEvents';
import { useNavigate } from 'react-router';

export const EventUpdatesPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
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

    const handleEventClick = (eventId: string) => {
        navigate(`/explorer/${eventId}`);
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
                {/* Left Panel - Event History Overview */}
                <EventHistoryOverview onEventClick={handleEventClick} />

                {/* Right Panel - No Longer Found Events */}
                <NoLongerFoundEvents onEventClick={handleEventClick} />
            </div>
        </div>
    );
};
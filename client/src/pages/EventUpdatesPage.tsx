import React, { useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEventsStore } from '../stores/eventsStore';
import { EventHistoryOverview } from '../components/EventHistoryOverview';
import { MissingEvents } from '../components/MissingEvents';
import { NewEvents } from '../components/NewEvents';
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
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-8 h-8 text-blue-400" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Event Updates</h1>
                            <p className="text-gray-400">Track changes in EMS events</p>
                        </div>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                        Last refresh: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 5s
                    </div>
                </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Left Panel - New Events */}
                <NewEvents onEventClick={handleEventClick} />

                {/* Middle Panel - Recent Archives */}
                <EventHistoryOverview onEventClick={handleEventClick} />

                {/* Right Panel - No Longer Found Events */}
                <MissingEvents onEventClick={handleEventClick} />
            </div>
            </div>
        </div>
    );
};
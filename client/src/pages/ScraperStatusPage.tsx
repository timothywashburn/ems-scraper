import React, { useEffect } from 'react';
import { Activity } from 'lucide-react';
import { ScraperStatusCard } from '../components/scraper/ScraperStatusCard';
import { ScraperMetrics } from '../components/scraper/ScraperStatistics.tsx';
import { ScraperActivityLog } from '../components/scraper/ScraperActivityLog';
import { useScraperStore } from '../stores/scraperStore';
import { useAuth } from '../contexts/AuthContext';


export const ScraperStatusPage: React.FC = () => {
    const { user } = useAuth();
    const {
        overview: scraperOverview,
        activities,
        overviewLoading,
        logsLoading,
        overviewError,
        logsError,
        lastRefresh,
        controlScraper,
        startPolling,
        stopPolling
    } = useScraperStore();

    const handleScraperControl = async (action: 'start' | 'stop') => {
        if (user?.token) {
            await controlScraper(user.token, action);
        }
    };

    // Start/stop polling based on user authentication
    useEffect(() => {
        if (user?.token) {
            startPolling(user.token);
        } else {
            stopPolling();
        }

        return () => {
            stopPolling();
        };
    }, [user?.token, startPolling, stopPolling]);
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <Activity className="w-8 h-8 text-blue-400" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Scraper Status</h1>
                            <p className="text-gray-400">Monitor continuous scraper performance</p>
                        </div>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                        Last refresh: {lastRefresh.toLocaleTimeString()} • Auto-refresh every 2s
                    </div>
                </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <ScraperStatusCard
                            status={scraperOverview}
                            isLoading={overviewLoading}
                            error={overviewError}
                            onStartStop={handleScraperControl}
                        />
                    </div>

                    <div>
                        <ScraperMetrics
                            metrics={scraperOverview}
                            isLoading={overviewLoading}
                            error={overviewError}
                        />
                    </div>
                </div>

                <div>
                    <ScraperActivityLog
                        activities={activities}
                        isLoading={logsLoading}
                        error={logsError}
                    />
                </div>
            </div>
            </div>
        </div>
    );
};
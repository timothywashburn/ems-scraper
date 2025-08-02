import React from 'react';
import { BarChart3, Database, Calendar as CalendarIcon, Clock, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ScraperStatistics {
    totalEvents: number;
    eventsToday: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
    lastEventUpdate: string | null;
}

interface ScraperMetricsProps {
    metrics: ScraperStatistics | null;
    isLoading: boolean;
    error: string | null;
}

export const ScraperMetrics: React.FC<ScraperMetricsProps> = ({
    metrics,
    isLoading,
    error
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="ml-2 text-gray-300">Loading metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-800 rounded-lg border border-red-700 p-6">
                <div className="flex items-center text-red-400">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <span>Error loading metrics: {error}</span>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="text-center text-gray-400">
                    No metrics available
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full flex flex-col">
            <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Event Statistics</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{metrics.totalEvents.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{metrics.eventsToday.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Today</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{metrics.eventsThisWeek.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">This Week</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{metrics.eventsThisMonth.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">This Month</div>
                </div>
            </div>

            {metrics.lastEventUpdate && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">Last Event Update:</span>
                        <span className="ml-2 text-sm text-blue-400">
                            {formatDate(metrics.lastEventUpdate)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
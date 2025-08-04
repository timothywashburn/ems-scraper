import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Loader2, Play, Square } from 'lucide-react';

interface ScraperStatus {
    isRunning: boolean;
    currentDate?: string;
    lastUpdate?: string;
}

interface ScraperStatusCardProps {
    status: ScraperStatus | null;
    isLoading: boolean;
    error: string | null;
    onStartStop: (action: 'start' | 'stop') => Promise<void>;
}

export const ScraperStatusCard: React.FC<ScraperStatusCardProps> = ({
    status,
    isLoading,
    error,
    onStartStop
}) => {
    const [pendingAction, setPendingAction] = useState<'start' | 'stop' | null>(null);

    // Clear pending action when the status changes to match the intended state
    useEffect(() => {
        if (pendingAction && status) {
            if ((pendingAction === 'start' && status.isRunning) ||
                (pendingAction === 'stop' && !status.isRunning)) {
                setPendingAction(null);
            }
        }
    }, [status?.isRunning, pendingAction]);

    const handleStartStop = async (action: 'start' | 'stop') => {
        setPendingAction(action);
        try {
            await onStartStop(action);
        } catch (error) {
            console.error('Scraper control error:', error);
            setPendingAction(null); // Clear pending state on error
        }
    };

    const formatUptime = (uptime?: number) => {
        if (!uptime) return 'N/A';
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const formatLastUpdate = (lastUpdate?: string) => {
        if (!lastUpdate) return 'Never';
        const date = new Date(lastUpdate);
        return date.toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="ml-2 text-gray-300">Loading scraper status...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-800 rounded-lg border border-red-700 p-6">
                <div className="flex items-center text-red-400">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <span>Error loading scraper status: {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full flex flex-col">
            <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Scraper Control</h3>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-gray-300">
                    <span className="text-sm">Current Date:</span>
                    <span className="text-sm font-mono text-blue-400">
                        {status?.currentDate || 'N/A'}
                    </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                    <span className="text-sm">Last Update:</span>
                    <span className="text-xs text-gray-400">
                        {formatLastUpdate(status?.lastUpdate)}
                    </span>
                </div>
            </div>

            <div className="flex gap-3">
                {!status?.isRunning ? (
                    <button
                        type="button"
                        onClick={() => handleStartStop('start')}
                        disabled={pendingAction !== null}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        {pendingAction === 'start' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        {pendingAction === 'start' ? 'Starting...' : 'Start Scraper'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleStartStop('stop')}
                        disabled={pendingAction !== null}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        {pendingAction === 'stop' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        {pendingAction === 'stop' ? 'Stopping...' : 'Stop Scraper'}
                    </button>
                )}
            </div>
        </div>
    );
};
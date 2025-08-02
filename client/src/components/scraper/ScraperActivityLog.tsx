import React from 'react';
import { ScrollText, Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ActivityLogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

interface ScraperActivityLogProps {
    activities: ActivityLogEntry[];
    isLoading: boolean;
    error: string | null;
}

export const ScraperActivityLog: React.FC<ScraperActivityLogProps> = ({
    activities,
    isLoading,
    error
}) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-red-400" />;
            case 'info':
            default:
                return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    const getTextColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'text-green-300';
            case 'error':
                return 'text-red-300';
            case 'info':
            default:
                return 'text-gray-300';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (diff < 60000) {
            const seconds = Math.floor(diff / 1000);
            return `${seconds}s ago`;
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center mb-4">
                    <ScrollText className="w-5 h-5 text-yellow-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">Activity Log</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="ml-2 text-gray-300">Loading activity log...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center mb-4">
                    <ScrollText className="w-5 h-5 text-yellow-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">Activity Log</h3>
                </div>
                <div className="flex items-center text-red-400">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <span>Error loading activity log: {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center mb-4">
                <ScrollText className="w-5 h-5 text-yellow-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Activity Log</h3>
            </div>
            
            {activities.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                    No recent activity
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {activities.slice(0, 20).map((activity, index) => (
                        <div key={`${activity.id}-${activity.timestamp}`} className="flex items-start space-x-3 p-3 rounded-md bg-gray-700/50">
                            <div className="flex-shrink-0 mt-0.5">
                                {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm ${getTextColor(activity.type)}`}>
                                    {activity.message}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatTimestamp(activity.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
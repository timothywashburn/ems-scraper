import React from 'react';
import { ScraperStatusCard } from '../components/scraper/ScraperStatusCard';
import { ScraperMetrics } from '../components/scraper/ScraperStatistics.tsx';
import { ScraperActivityLog } from '../components/scraper/ScraperActivityLog';

interface ScraperOverview {
  isRunning: boolean;
  currentDate?: string;
  lastUpdate?: string;
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  lastEventUpdate: string | null;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ScraperStatusPageProps {
  scraperOverview: ScraperOverview | null;
  activities: ActivityLogEntry[];
  overviewLoading: boolean;
  logsLoading: boolean;
  overviewError: string | null;
  logsError: string | null;
  lastRefresh: Date;
  onScraperControl: (action: 'start' | 'stop') => Promise<void>;
}

export const ScraperStatusPage: React.FC<ScraperStatusPageProps> = ({
  scraperOverview,
  activities,
  overviewLoading,
  logsLoading,
  overviewError,
  logsError,
  lastRefresh,
  onScraperControl
}) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Scraper Status</h2>
        <div className="text-xs text-gray-400">
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
              onStartStop={onScraperControl}
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
  );
};
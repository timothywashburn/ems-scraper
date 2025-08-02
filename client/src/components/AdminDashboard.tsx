import React, { useState, useEffect } from 'react';
import { Activity, Calendar, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ScraperStatusCard } from './scraper/ScraperStatusCard';
import { ScraperMetrics } from './scraper/ScraperStatistics.tsx';
import { ScraperActivityLog } from './scraper/ScraperActivityLog';

type DashboardView = 'scraper' | 'events';

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

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('scraper');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Scraper data state
  const [scraperOverview, setScraperOverview] = useState<ScraperOverview | null>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // API functions
  const fetchScraperOverview = async () => {
    try {
      const response = await fetch('/api/scraper/overview', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setScraperOverview(result.data);
        setOverviewError(null);
      } else {
        setOverviewError(result.error?.message || 'Failed to fetch overview');
      }
    } catch (error) {
      setOverviewError('Network error');
      console.error('Failed to fetch scraper overview:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchScraperLogs = async () => {
    try {
      const response = await fetch('/api/scraper/logs', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data.activities);
        setLogsError(null);
      } else {
        setLogsError(result.error?.message || 'Failed to fetch logs');
      }
    } catch (error) {
      setLogsError('Network error');
      console.error('Failed to fetch scraper logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleScraperControl = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/scraper/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ action }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh overview and logs immediately after control action
        await Promise.all([fetchScraperOverview(), fetchScraperLogs()]);
      } else {
        console.error('Scraper control failed:', result.error?.message);
      }
    } catch (error) {
      console.error('Scraper control error:', error);
    }
  };

  // Unified polling effect for real-time updates (every 2 seconds)
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchScraperOverview(),
        fetchScraperLogs()
      ]);
      setLastRefresh(new Date());
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const navigation = [
    {
      id: 'scraper' as DashboardView,
      name: 'Scraper Status',
      icon: Activity,
      description: 'Monitor continuous scraper performance',
    },
    {
      id: 'events' as DashboardView,
      name: 'Event Updates',
      icon: Calendar,
      description: 'Track changes in EMS events',
      disabled: true,
    },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'scraper':
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
        );
      case 'events':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Event Updates</h2>
            <div className="bg-gray-800 rounded-lg shadow border border-gray-700 p-6">
              <div className="text-center text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p>Event tracking dashboard coming soon...</p>
                <p className="text-sm mt-2">
                  This will show event changes over time and help visualize EMS data trends.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-700`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-white">EMS Scraper</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    setCurrentView(item.id);
                    setIsSidebarOpen(false);
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-900/50 text-blue-300'
                    : item.disabled
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                title={item.disabled ? 'Coming soon' : item.description}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
                {item.disabled && (
                  <span className="ml-auto text-xs text-gray-500">Soon</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-white">Admin User</p>
              <p className="text-gray-400 truncate">{user?.comment}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-md text-gray-400 hover:text-gray-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <div className="lg:hidden bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {navigation.find(item => item.id === currentView)?.name}
            </h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
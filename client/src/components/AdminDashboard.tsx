import React, { useState } from 'react';
import { Activity, Calendar, Key, LogOut, Menu, Search, X, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ScraperStatusPage } from '../pages/ScraperStatusPage';
import { EventUpdatesPage } from '../pages/EventUpdatesPage';
import { EventExplorerPage } from '../pages/EventExplorerPage';
import { ApiKeyManagementPage } from '../pages/ApiKeyManagementPage';
import { ScriptsManagementPage } from '../pages/ScriptsManagementPage';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';

type DashboardView = 'scraper' | 'events' | 'explorer' | 'api-keys' | 'scripts';


export const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Determine current view from URL
    const getCurrentView = (): DashboardView => {
        const path = location.pathname;
        if (path.startsWith('/explorer')) return 'explorer';
        if (path.startsWith('/events')) return 'events';
        if (path.startsWith('/api-keys')) return 'api-keys';
        if (path.startsWith('/scripts')) return 'scripts';
        if (path.startsWith('/status')) return 'scraper';
        return 'scraper';
    };

    const currentView = getCurrentView();

    const navigation = [
        {
            id: 'scraper' as DashboardView,
            name: 'Scraper Status',
            icon: Activity,
            description: 'Monitor continuous scraper performance',
            path: '/status',
        },
        {
            id: 'events' as DashboardView,
            name: 'Event Updates',
            icon: Calendar,
            description: 'Track changes in EMS events',
            disabled: false,
            path: '/events',
        },
        {
            id: 'explorer' as DashboardView,
            name: 'Event Explorer',
            icon: Search,
            description: 'Search and explore event details and history',
            disabled: false,
            path: '/explorer',
        },
        {
            id: 'api-keys' as DashboardView,
            name: 'API Keys',
            icon: Key,
            description: 'Manage API tokens and access keys',
            disabled: false,
            path: '/api-keys',
        },
        {
            id: 'scripts' as DashboardView,
            name: 'Scripts',
            icon: Database,
            description: 'Control population scripts and monitor table status',
            disabled: false,
            path: '/scripts',
        },
    ];


    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <div
                className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-700`}>
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
                                        navigate(item.path);
                                        setIsSidebarOpen(false);
                                    }
                                }}
                                disabled={item.disabled}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive
                                        ? 'bg-blue-900/50 text-blue-300'
                                        : item.disabled
                                            ? 'text-gray-500 cursor-not-allowed'
                                            : 'text-gray-300 hover:bg-gray-700 cursor-pointer'
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
                            className="p-2 rounded-md text-gray-400 hover:text-gray-300 cursor-pointer"
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
                    <Routes>
                        <Route path="/" element={<Navigate to="/status" replace />} />
                        <Route path="/status" element={<ScraperStatusPage />} />
                        <Route path="/events" element={<EventUpdatesPage />} />
                        <Route path="/explorer" element={<EventExplorerPage />} />
                        <Route path="/explorer/:eventId" element={<EventExplorerPage />} />
                        <Route path="/api-keys" element={<ApiKeyManagementPage />} />
                        <Route path="/scripts" element={<ScriptsManagementPage />} />
                    </Routes>
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
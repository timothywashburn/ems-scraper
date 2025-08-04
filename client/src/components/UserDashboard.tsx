import React from 'react';
import { CheckCircle, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserDashboard: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md text-center border border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/50 rounded-full mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    Successfully Authenticated
                </h1>

                <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-200">Token Details</span>
                    </div>
                    <p className="text-sm text-gray-300">
                        <span className="font-medium">Comment:</span> {user?.comment}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                        <span className="font-medium">Type:</span> Standard User
                    </p>
                </div>

                <p className="text-gray-300 mb-8">
                    You have been successfully authenticated with the EMS Scraper system.
                    Your access level allows you to view this dashboard.
                </p>

                <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700
          transition-colors cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>

                <div className="mt-6 text-xs text-gray-400">
                    Need admin access? Contact your administrator
                </div>
            </div>
        </div>
    );
};
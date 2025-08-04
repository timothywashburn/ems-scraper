import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TokenInput } from './components/TokenInput';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { Loader2 } from 'lucide-react';
import { BrowserRouter } from 'react-router';

function AppContent() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <TokenInput />;
    }

    if (user.is_admin) {
        return (
            <BrowserRouter>
                <AdminDashboard />
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <UserDashboard />
        </BrowserRouter>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App
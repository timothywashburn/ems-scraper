import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TokenPrompt } from './components/TokenPrompt';
import { Loader2 } from 'lucide-react';

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-background text-on-background p-8">
      <h1 className="text-3xl font-bold mb-4">EMS Scraper Client</h1>
      <p className="text-on-background/70">Welcome! You are successfully authenticated.</p>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isValidating, login } = useAuth();

  if (isValidating) {
    return (
      <div className="fixed inset-0 bg-surface flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-on-surface/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <TokenPrompt onTokenSubmit={login} isValidating={isValidating} />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
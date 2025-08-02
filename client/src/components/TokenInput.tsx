import React, { useState } from 'react';
import { Key, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const TokenInput: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(token.trim());
      
      if (!success) {
        setError('Invalid token. Please check your token and try again.');
      }
    } catch (err) {
      setError('Failed to validate token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/50 rounded-full mb-4">
            <Key className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            EMS Scraper
          </h1>
          <p className="text-gray-300">
            Enter your access token to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-200 mb-2">
              Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your token"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent 
            rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none 
            focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
            ${isLoading ? '' : 'cursor-pointer'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Need a token? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};
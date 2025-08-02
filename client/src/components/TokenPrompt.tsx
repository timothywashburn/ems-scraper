import { useState } from 'react';
import { Key, AlertCircle, Loader2 } from 'lucide-react';

interface TokenPromptProps {
    onTokenSubmit: (token: string) => Promise<boolean>;
    isValidating: boolean;
}

export function TokenPrompt({ onTokenSubmit, isValidating }: TokenPromptProps) {
    const [token, setToken] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token.trim()) {
            setError('Please enter a token');
            return;
        }

        setError(null);
        const success = await onTokenSubmit(token.trim());
        
        if (!success) {
            setError('Invalid token. Please check and try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-surface flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                        <Key className="w-8 h-8 text-on-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-on-surface mb-2">
                        Authentication Required
                    </h1>
                    <p className="text-on-surface/70">
                        Please enter your access token to continue
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter your token..."
                            className="w-full px-4 py-3 border border-outline rounded-lg bg-background text-on-background placeholder-on-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={isValidating}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-error text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isValidating || !token.trim()}
                        className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isValidating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            'Authenticate'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
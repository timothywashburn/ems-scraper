import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    isValidating: boolean;
    login: (token: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

const TOKEN_STORAGE_KEY = 'ems-scraper-token';

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(true);

    const validateToken = async (tokenToValidate: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: tokenToValidate }),
            });

            if (!response.ok) {
                return false;
            }

            const result = await response.json();
            return result.success && result.data.valid;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    };

    const login = async (newToken: string): Promise<boolean> => {
        setIsValidating(true);
        const isValid = await validateToken(newToken);
        
        if (isValid) {
            setToken(newToken);
            localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        }
        
        setIsValidating(false);
        return isValid;
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
            
            if (storedToken) {
                const isValid = await validateToken(storedToken);
                if (isValid) {
                    setToken(storedToken);
                } else {
                    localStorage.removeItem(TOKEN_STORAGE_KEY);
                }
            }
            
            setIsValidating(false);
        };

        initializeAuth();
    }, []);

    const value = {
        token,
        isAuthenticated: !!token,
        isValidating,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
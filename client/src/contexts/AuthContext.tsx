import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthUser {
    token: string;
    is_admin: boolean;
    comment: string;
    last_used?: Date | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    login: (token: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const validateToken = async (token: string): Promise<AuthUser | null> => {
        try {
            const response = await fetch('/api/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const result = await response.json();

            if (result.success && result.data.valid) {
                return {
                    token,
                    is_admin: result.data.is_admin,
                    comment: result.data.comment,
                    last_used: result.data.last_used,
                };
            }

            return null;
        } catch (error) {
            console.error('Token validation failed:', error);
            return null;
        }
    };

    const login = async (token: string): Promise<boolean> => {
        const validatedUser = await validateToken(token);

        if (validatedUser) {
            setUser(validatedUser);
            localStorage.setItem('auth_token', token);
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_token');
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');

            if (storedToken) {
                const validatedUser = await validateToken(storedToken);

                if (validatedUser) {
                    setUser(validatedUser);
                } else {
                    localStorage.removeItem('auth_token');
                }
            }

            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
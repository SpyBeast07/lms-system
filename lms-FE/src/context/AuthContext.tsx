import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/api';
import { decodeToken } from '../utils/jwt';

interface AuthContextType {
    user: string | null; // Specifically maps to 'sub'
    name: string | null; // Maps to decoded user's name
    role: 'super_admin' | 'teacher' | 'student' | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const [role, setRole] = useState<'super_admin' | 'teacher' | 'student' | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser(decoded.sub);
                setName(decoded.name);
                setRole(decoded.role);
                setIsAuthenticated(true);
            } else if (decoded && decoded.exp * 1000 <= Date.now()) {
                // Token exists but is expired. The Axios interceptor handles refreshing it lazily initially.
                // However, we still need to temporarily set authenticated to keep the UI from flashing
                // until an API call fails or refreshes it.
                setUser(decoded.sub);
                setName(decoded.name);
                setRole(decoded.role);
                setIsAuthenticated(true);
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
            setName(null);
            setRole(null);
        }
        setIsLoading(false);
    };

    const login = async (username: string, password: string): Promise<void> => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        // Hit the raw API endpoint so we don't trigger the interceptor unintentionally
        const response = await api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);

        if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
        }

        const decoded = decodeToken(access_token);
        if (decoded) {
            setUser(decoded.sub);
            setName(decoded.name);
            setRole(decoded.role);
            setIsAuthenticated(true);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setName(null);
        setRole(null);
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return <div>Loading authentication state...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, name, role, isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

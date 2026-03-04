"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../services/authService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (response: AuthResponse) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for existing session on mount
        const savedToken = localStorage.getItem('rms_token');
        const savedUser = localStorage.getItem('rms_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (response: AuthResponse) => {
        const { user, token } = response.data;
        setUser(user);
        setToken(token);

        localStorage.setItem('rms_token', token);
        localStorage.setItem('rms_user', JSON.stringify(user));

        // Redirect based on role
        if (user.role === 'WAITER') {
            router.push('/garson');
        } else {
            router.push('/kasa');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('rms_token');
        localStorage.removeItem('rms_user');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

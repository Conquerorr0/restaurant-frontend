import { apiRequest } from './api';

export interface User {
    id: string;
    username?: string;
    name: string;
    role: 'SUPER_ADMIN' | 'CASHIER' | 'WAITER';
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

export const authService = {
    /**
     * Standard login for Admin and Cashier
     */
    login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
        return apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    /**
     * PIN login for Waiters
     */
    pinLogin: async (pin: string): Promise<AuthResponse> => {
        return apiRequest<AuthResponse>('/auth/pin-login', {
            method: 'POST',
            body: JSON.stringify({ pin_code: pin }),
        });
    }
};

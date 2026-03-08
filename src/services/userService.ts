import { apiRequest } from './api';

export interface User {
    id: string;
    username: string;
    name_surname: string;
    role: 'SUPER_ADMIN' | 'CASHIER' | 'WAITER';
    pin_code?: string;
    created_at?: string;
}

export const userService = {
    getUsers: (token: string) => {
        return apiRequest<{ success: boolean; data: User[] }>('/users', { token });
    },

    addUser: (userData: any, token: string) => {
        return apiRequest<{ success: boolean; data: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            token
        });
    },

    updateUser: (id: string, userData: any, token: string) => {
        return apiRequest<{ success: boolean; data: User }>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
            token
        });
    },

    deleteUser: (id: string, token: string) => {
        return apiRequest<{ success: boolean }>(`/users/${id}`, {
            method: 'DELETE',
            token
        });
    }
};

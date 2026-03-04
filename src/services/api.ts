/**
 * API Service Utility
 * Centralizes all backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

interface RequestOptions extends RequestInit {
    token?: string | null;
}

export const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { token, ...customConfig } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(customConfig.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API error occurred');
        }

        return result;
    } catch (error: any) {
        console.error(`API Request Error [${endpoint}]:`, error.message);
        throw error;
    }
};

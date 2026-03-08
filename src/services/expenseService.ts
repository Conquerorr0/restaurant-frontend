import { apiRequest } from './api';
import { ApiResponse } from './tableService';

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    description?: string;
}

export const expenseService = {
    getExpenses: (token: string, startDate?: string, endDate?: string): Promise<ApiResponse<Expense[]>> => {
        let url = '/expenses';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        return apiRequest<ApiResponse<Expense[]>>(url, { token });
    },

    createExpense: (data: Partial<Expense>, token: string): Promise<ApiResponse<Expense>> => {
        return apiRequest<ApiResponse<Expense>>('/expenses', {
            method: 'POST',
            token,
            body: JSON.stringify(data)
        });
    },

    deleteExpense: (id: string, token: string): Promise<ApiResponse<void>> => {
        return apiRequest<ApiResponse<void>>(`/expenses/${id}`, {
            method: 'DELETE',
            token
        });
    }
};

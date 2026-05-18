import { apiRequest } from './api';
import { ApiResponse } from './tableService';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD';

export interface PaymentItem {
    orderItemId: string;
    quantity: number;
}

export interface PaymentRequest {
    orderId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    items?: PaymentItem[];
}

export interface PaymentResult {
    payment: any;
    isFullyPaid: boolean;
    balanceRemaining: number;
}

export const paymentService = {
    processPayment: async (data: PaymentRequest, token: string): Promise<ApiResponse<PaymentResult>> => {
        return apiRequest<ApiResponse<PaymentResult>>('/payments', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        });
    },

    deletePayment: async (id: string, token: string): Promise<ApiResponse<{ id: string }>> => {
        return apiRequest<ApiResponse<{ id: string }>>(`/payments/${id}`, {
            method: 'DELETE',
            token,
        });
    }
};

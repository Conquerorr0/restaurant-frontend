import { apiRequest } from './api';
import { ApiResponse } from './tableService';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD';

export interface PaymentRequest {
    orderId: string;
    paymentMethod: PaymentMethod;
    amount: number;
}

export interface PaymentResult {
    payment: any;
    totalPaid: number;
    balanceRemaining: number;
    isFullyPaid: boolean;
    orderTotal: number;
}

export const paymentService = {
    /**
     * Process a payment for an order
     */
    processPayment: async (data: PaymentRequest, token: string): Promise<ApiResponse<PaymentResult>> => {
        return apiRequest<ApiResponse<PaymentResult>>('/payments', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        });
    }
};

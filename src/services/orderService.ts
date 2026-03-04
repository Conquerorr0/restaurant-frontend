import { apiRequest } from './api';
import { ApiResponse } from './tableService';

export interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Order {
    id: string;
    table_id: string;
    waiter_id: string;
    status: 'OPEN' | 'CLOSED' | 'CANCELLED';
    total_amount: number;
    items: OrderItem[];
    created_at: string;
}

export const orderService = {
    /**
     * Get active order for a table
     */
    getActiveOrder: async (tableId: string, token: string): Promise<ApiResponse<Order>> => {
        return apiRequest<ApiResponse<Order>>(`/orders/${tableId}`, {
            method: 'GET',
            token,
        });
    },

    /**
     * Create or update an order (add items)
     */
    createOrUpdateOrder: async (data: { tableId: string, items: { productId: string, quantity: number }[] }, token: string): Promise<ApiResponse<any>> => {
        return apiRequest<ApiResponse<any>>('/orders', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        });
    }
};

import { apiRequest } from './api';
import { ApiResponse } from './tableService';

export const printService = {
    printReceipt: (orderId: string, token: string, locale?: string): Promise<ApiResponse<{}>> =>
        apiRequest<ApiResponse<{}>>('/print/receipt', {
            method: 'POST',
            token,
            body: JSON.stringify({ orderId, locale }),
        }),
};

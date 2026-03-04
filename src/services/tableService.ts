import { apiRequest } from './api';

export type TableStatus = "EMPTY" | "OCCUPIED";

export interface Table {
    id: string;
    name: string;
    status: TableStatus;
    capacity: number;
    floor: string;
    active_order_id: string | null;
    total_order_amount: number;
    current_remaining_amount: number;
}

export interface TablesGrouped {
    [floor: string]: Table[];
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const tableService = {
    /**
     * Fetch all tables
     */
    getTables: async (token: string): Promise<ApiResponse<Table[]>> => {
        return apiRequest<ApiResponse<Table[]>>('/tables', {
            method: 'GET',
            token,
        });
    },

    /**
     * Fetch tables grouped by floor
     */
    getTablesByFloor: async (token: string): Promise<ApiResponse<TablesGrouped>> => {
        return apiRequest<ApiResponse<TablesGrouped>>('/tables/by-floor', {
            method: 'GET',
            token,
        });
    },

    /**
     * Get table details by ID
     */
    getTableById: async (id: string, token: string): Promise<ApiResponse<Table>> => {
        return apiRequest<ApiResponse<Table>>(`/tables/${id}`, { token });
    },

    /**
     * Move table (transfer order)
     */
    moveTable: async (fromTableId: string, toTableId: string, token: string): Promise<ApiResponse<any>> => {
        return apiRequest<ApiResponse<any>>('/tables/move', {
            method: 'POST',
            token,
            body: JSON.stringify({ fromTableId, toTableId })
        });
    },

    /**
     * Merge two tables
     */
    mergeTable: async (sourceTableId: string, targetTableId: string, token: string): Promise<ApiResponse<any>> => {
        return apiRequest<ApiResponse<any>>('/tables/merge', {
            method: 'POST',
            token,
            body: JSON.stringify({ sourceTableId, targetTableId })
        });
    },

    /**
     * Update table status or info (Admin only)
     */
    updateTable: async (id: string, data: Partial<Table>, token: string): Promise<ApiResponse<Table>> => {
        return apiRequest<ApiResponse<Table>>(`/tables/${id}`, {
            method: 'PUT',
            token,
            body: JSON.stringify(data),
        });
    }
};

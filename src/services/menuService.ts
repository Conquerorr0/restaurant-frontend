import { apiRequest } from './api';
import { ApiResponse } from './tableService';

export interface Category {
    id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    sort_order: number;
    is_active: boolean;
}

export const menuService = {
    /**
     * Fetch all active categories
     */
    getCategories: async (token: string): Promise<ApiResponse<Category[]>> => {
        return apiRequest<ApiResponse<Category[]>>('/categories', {
            method: 'GET',
            token,
        });
    },

    /**
     * Fetch all active products
     */
    getProducts: async (token: string): Promise<ApiResponse<Product[]>> => {
        return apiRequest<ApiResponse<Product[]>>('/products', {
            method: 'GET',
            token,
        });
    }
};

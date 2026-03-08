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
    // Categories
    getCategories: async (token: string): Promise<ApiResponse<Category[]>> => {
        return apiRequest<ApiResponse<Category[]>>('/categories', { token });
    },
    createCategory: async (data: any, token: string): Promise<ApiResponse<Category>> => {
        return apiRequest<ApiResponse<Category>>('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
            token
        });
    },
    updateCategory: async (id: string, data: any, token: string): Promise<ApiResponse<Category>> => {
        return apiRequest<ApiResponse<Category>>(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token
        });
    },
    deleteCategory: async (id: string, token: string): Promise<ApiResponse<void>> => {
        return apiRequest<ApiResponse<void>>(`/categories/${id}`, {
            method: 'DELETE',
            token
        });
    },

    // Products
    getProducts: async (token: string): Promise<ApiResponse<Product[]>> => {
        return apiRequest<ApiResponse<Product[]>>('/products', { token });
    },
    createProduct: async (data: any, token: string): Promise<ApiResponse<Product>> => {
        return apiRequest<ApiResponse<Product>>('/products', {
            method: 'POST',
            body: JSON.stringify(data),
            token
        });
    },
    updateProduct: async (id: string, data: any, token: string): Promise<ApiResponse<Product>> => {
        return apiRequest<ApiResponse<Product>>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token
        });
    },
    deleteProduct: async (id: string, token: string): Promise<ApiResponse<void>> => {
        return apiRequest<ApiResponse<void>>(`/products/${id}`, {
            method: 'DELETE',
            token
        });
    }
};

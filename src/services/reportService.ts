import { apiRequest } from './api';

export interface DailySummary {
    period: { start: string; end: string };
    total_revenue: number;
    order_count: number;
    payment_distribution: {
        CASH: number;
        CREDIT_CARD: number;
        MEAL_CARD: number;
    };
    total_expenses: number;
    total_cogs: number;
    gross_profit: number;
    net_profit: number;
}

export interface DashboardStats {
    today: {
        revenue: number;
        order_count: number;
        revenue_change: number;
        count_change: number;
    };
    personnel_count: number;
    occupancy_rate: number;
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface TopProduct {
    name: string;
    total_quantity: number;
    total_revenue: number;
}

export interface StaffPerformance {
    waiter_name: string;
    total_sales: number;
    order_count: number;
}

export const reportService = {
    getDailySummary: (token: string, startDate?: string, endDate?: string) => {
        let url = '/reports/daily-summary';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        return apiRequest<{ success: boolean; data: DailySummary }>(url, { token });
    },

    getDashboardStats: (token: string) => {
        return apiRequest<{ success: boolean; data: DashboardStats }>('/reports/dashboard-stats', { token });
    },

    getRevenueChartData: (token: string, period: 'week' | 'month' = 'week') => {
        return apiRequest<{ success: boolean; data: ChartDataPoint[] }>(`/reports/revenue-chart?period=${period}`, { token });
    },

    getTopProducts: (token: string, startDate?: string, endDate?: string) => {
        let url = '/reports/top-products';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        return apiRequest<{ success: boolean; data: TopProduct[] }>(url, { token });
    },

    getStaffPerformance: (token: string, startDate?: string, endDate?: string) => {
        let url = '/reports/staff-performance';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        return apiRequest<{ success: boolean; data: StaffPerformance[] }>(url, { token });
    }
};

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
    cancel_total?: number;
    treat_total?: number;
}

export interface DashboardStats {
    today: {
        revenue: number;
        order_count: number;
        revenue_change: number;
        count_change: number;
        avg_ticket?: number;
        avg_ticket_change?: number;
    };
    personnel_count: number;
    occupancy_rate: number;
}

export interface ChartDataPoint {
    label: string;
    value: number;
    expenses?: number;
    net?: number;
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

export interface DailyBreakdownRow {
    date: string;
    revenue: number;
    cash: number;
    card: number;
    meal: number;
    expenses: number;
    net: number;
    expense_details: { amount: number; category: string; description: string }[];
}

export interface DailyBreakdown {
    rows: DailyBreakdownRow[];
    totals: { revenue: number; expenses: number; net: number };
}

export interface MonthlyAggregatePeriod {
    month: number;
    label: string;
    revenue: number;
    expenses: number;
    net: number;
}

export interface MonthlyAggregate {
    year: number;
    months: MonthlyAggregatePeriod[];
}

export interface HourlyHeatmap {
    revenue_by_hour: number[][];
    order_count_by_hour: number[][];
    days: string[];
}

export interface PaymentTrendPoint {
    label: string;
    cash: number;
    card: number;
    meal: number;
    total: number;
}

export interface PaymentTransaction {
    id: string;
    created_at: string;
    time_label: string;
    date_label: string;
    table_name: string;
    waiter_name: string;
    payment_method: 'CASH' | 'CREDIT_CARD' | 'MEAL_CARD' | 'CANCEL' | 'TREAT';
    amount: number;
}

export interface PaymentsList {
    rows: PaymentTransaction[];
    summary: {
        total_revenue: number;
        transaction_count: number;
        cancel_total: number;
        treat_total: number;
        by_method: { CASH: number; CREDIT_CARD: number; MEAL_CARD: number };
    };
}

const buildParams = (obj: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => { if (v) params.append(k, v); });
    return params.toString();
};

export const reportService = {
    getDailySummary: (token: string, startDate?: string, endDate?: string) => {
        const q = buildParams({ startDate, endDate });
        return apiRequest<{ success: boolean; data: DailySummary }>(`/reports/daily-summary${q ? `?${q}` : ''}`, { token });
    },

    getDashboardStats: (token: string) => {
        return apiRequest<{ success: boolean; data: DashboardStats }>('/reports/dashboard-stats', { token });
    },

    getRevenueChartData: (token: string, period?: 'week' | 'month', startDate?: string, endDate?: string) => {
        let q: string;
        if (startDate && endDate) {
            q = buildParams({ startDate, endDate });
        } else {
            q = buildParams({ period: period ?? 'week' });
        }
        return apiRequest<{ success: boolean; data: ChartDataPoint[] }>(`/reports/revenue-chart?${q}`, { token });
    },

    getTopProducts: (token: string, startDate?: string, endDate?: string) => {
        const q = buildParams({ startDate, endDate });
        return apiRequest<{ success: boolean; data: TopProduct[] }>(`/reports/top-products${q ? `?${q}` : ''}`, { token });
    },

    getStaffPerformance: (token: string, startDate?: string, endDate?: string) => {
        const q = buildParams({ startDate, endDate });
        return apiRequest<{ success: boolean; data: StaffPerformance[] }>(`/reports/staff-performance${q ? `?${q}` : ''}`, { token });
    },

    getDailyBreakdown: (token: string, period?: 'week' | 'month', startDate?: string, endDate?: string) => {
        let q: string;
        if (startDate && endDate) {
            q = buildParams({ startDate, endDate });
        } else {
            q = buildParams({ period: period ?? 'week' });
        }
        return apiRequest<{ success: boolean; data: DailyBreakdown }>(`/reports/daily-breakdown?${q}`, { token });
    },

    getMonthlyAggregate: (token: string, year?: number) => {
        const q = year ? `?year=${year}` : '';
        return apiRequest<{ success: boolean; data: MonthlyAggregate }>(`/reports/monthly-aggregate${q}`, { token });
    },

    getHourlyHeatmap: (token: string, startDate?: string, endDate?: string) => {
        const q = buildParams({ startDate, endDate });
        return apiRequest<{ success: boolean; data: HourlyHeatmap }>(`/reports/hourly-heatmap${q ? `?${q}` : ''}`, { token });
    },

    getPaymentTrend: (token: string, period?: 'week' | 'month', startDate?: string, endDate?: string) => {
        let q: string;
        if (startDate && endDate) {
            q = buildParams({ startDate, endDate });
        } else {
            q = buildParams({ period: period ?? 'week' });
        }
        return apiRequest<{ success: boolean; data: PaymentTrendPoint[] }>(`/reports/payment-trend?${q}`, { token });
    },

    getPaymentsList: (token: string, startDate?: string, endDate?: string) => {
        const q = buildParams({ startDate, endDate });
        return apiRequest<{ success: boolean; data: PaymentsList }>(`/reports/payments-list${q ? `?${q}` : ''}`, { token });
    }
};

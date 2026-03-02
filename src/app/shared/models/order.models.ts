export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  unit_price: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface Order {
  id: string;
  farm_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: OrderStatus;
  total_price: number;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  notes?: string;
  items: { product_id: string; quantity: number }[];
}

export interface UpdateStatusRequest {
  status: OrderStatus;
}

export interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface AnalyticsResponse {
  total_revenue: number;
  total_orders: number;
  orders_by_status: StatusCount[];
  revenue_by_month: MonthlyRevenue[];
  top_products: TopProduct[];
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED',   'CANCELLED'],
  SHIPPED:   ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

import { cloudflare as supabase } from '@/integrations/cloudflare/client';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Order = Tables<'orders'>;
type OrderItem = Tables<'order_items'>;

export const ordersService = {
  async getByUser(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Failed to fetch orders for user ${userId}`, error);
      throw error;
    }
  },

  async getById(orderId: string): Promise<(Order & { order_items: OrderItem[] }) | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to fetch order ${orderId}`, error);
      throw error;
    }
  },

  async create(orderData: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    billing_address?: string;
    billing_city?: string;
    billing_postal_code?: string;
    billing_country?: string;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    total: number;
    discount_code?: string;
    user_id?: string;
  }): Promise<Order> {
    try {
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create order', error);
      throw error;
    }
  },

  async updateStatus(
    orderId: string,
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  ): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to update order status for ${orderId}`, error);
      throw error;
    }
  },

  async addItems(orderId: string, items: Omit<OrderItem, 'id' | 'created_at'>[]): Promise<OrderItem[]> {
    try {
      const itemsWithOrderId = items.map((item) => ({
        ...item,
        order_id: orderId,
      }));

      const { data, error } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Failed to add items to order ${orderId}`, error);
      throw error;
    }
  },
};

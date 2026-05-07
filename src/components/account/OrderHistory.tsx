import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { apiBaseUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Package, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  product_category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface Order {
  id: string;
  status: string;
  email: string;
  first_name: string;
  last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  shipping_method: string;
  created_at: string;
  invoice_url?: string;
  order_items?: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const OrderHistory = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      toast.error('Failed to load orders');
      setLoading(false);
      return;
    }

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        
        return {
          ...order,
          order_items: (itemsData || []) as OrderItem[],
        };
      })
    );

    setOrders(ordersWithItems as Order[]);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoice(orderId);
    try {
      // Worker /orders/:id/invoice returns server-rendered HTML. Open in a
      // new tab — customer can save-as-PDF via browser print dialog.
      const url = `${apiBaseUrl()}/orders/${encodeURIComponent(orderId)}/invoice`;
      const token = (typeof localStorage !== 'undefined' && localStorage.getItem('cf_session')) || '';
      // Auth header can't be passed via window.open; embed token as query
      // string is unsafe (URL leakage). Instead fetch + open Blob URL.
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed to generate invoice');
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
      toast.success('Invoice opened in a new tab');
    } catch {
      toast.error('Failed to generate invoice. Please try again.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-light text-foreground mb-6">Order History</h2>
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-light text-foreground mb-6">Order History</h2>
        <p className="text-muted-foreground">
          You haven't placed any orders yet. Start shopping to see your order history here.
        </p>
        <Link to="/category/shop">
          <Button variant="outline" className="mt-4">
            Browse Collection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-light text-foreground mb-6">Order History</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            {/* Order Header */}
            <button
              onClick={() => toggleOrderExpanded(order.id)}
              className="w-full p-4 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)} • {order.order_items?.length || 0} item(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={`${statusColors[order.status]} capitalize`}>
                  {order.status}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {formatPrice(Number(order.total))}
                </span>
                {expandedOrderId === order.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded Order Details */}
            {expandedOrderId === order.id && (
              <div className="p-4 border-t border-border">
                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.product_category} • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {formatPrice(Number(item.line_total))}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-2">Shipping Address</p>
                    <p className="text-muted-foreground">
                      {order.first_name} {order.last_name}<br />
                      {order.shipping_address}<br />
                      {order.shipping_city}, {order.shipping_postal_code}<br />
                      {order.shipping_country}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">Order Summary</p>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(Number(order.subtotal))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping ({order.shipping_method})</span>
                        <span>
                          {Number(order.shipping_cost) === 0 
                            ? 'Free' 
                            : formatPrice(Number(order.shipping_cost))}
                        </span>
                      </div>
                      {Number(order.discount_amount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(Number(order.discount_amount))}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-foreground pt-2 border-t border-border">
                        <span>Total</span>
                        <span>{formatPrice(Number(order.total))}</span>
                      </div>
                    </div>
                    
                    {/* Download Invoice Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleDownloadInvoice(order.id)}
                      disabled={downloadingInvoice === order.id}
                    >
                      {downloadingInvoice === order.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Download Invoice
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
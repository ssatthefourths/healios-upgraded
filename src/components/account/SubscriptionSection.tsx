import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { RefreshCw, Pause, Play, X, Calendar, Package, SkipForward } from 'lucide-react';
import FrequencyChangeDialog from '@/components/subscription/FrequencyChangeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Subscription {
  id: string;
  product_id: string;
  status: 'active' | 'paused' | 'cancelled';
  price: number;
  frequency: 'monthly' | 'bimonthly' | 'quarterly';
  next_delivery_date: string;
  created_at: string;
  paused_at: string | null;
  cancelled_at: string | null;
  product?: {
    name: string;
    image: string;
    category: string;
  };
}

const SubscriptionSection = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    // Explicitly select only user-safe fields (exclude stripe_subscription_id)
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id, product_id, status, price, frequency, next_delivery_date, 
        created_at, updated_at, paused_at, cancelled_at, user_id,
        product:products(name, image, category)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
    } else {
      setSubscriptions((data as unknown as Subscription[]) || []);
    }
    setLoading(false);
  };

  const handlePause = async (subscriptionId: string) => {
    setUpdatingId(subscriptionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { subscription_id: subscriptionId, action: 'pause' }
      });

      if (error) throw error;
      
      toast.success('Subscription paused');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('Failed to pause subscription');
    }
    setUpdatingId(null);
  };

  const handleResume = async (subscriptionId: string) => {
    setUpdatingId(subscriptionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { subscription_id: subscriptionId, action: 'resume' }
      });

      if (error) throw error;
      
      toast.success('Subscription resumed');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
    }
    setUpdatingId(null);
  };

  const handleCancel = async (subscriptionId: string) => {
    setUpdatingId(subscriptionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { subscription_id: subscriptionId, action: 'cancel' }
      });

      if (error) throw error;
      
      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
    setUpdatingId(null);
  };

  const handleSkip = async (subscriptionId: string) => {
    setUpdatingId(subscriptionId);
    
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { subscription_id: subscriptionId, action: 'skip' }
      });

      if (error) throw error;
      
      toast.success('Next delivery skipped');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error skipping delivery:', error);
      toast.error('Failed to skip delivery');
    }
    setUpdatingId(null);
  };

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'monthly': return 'Every month';
      case 'bimonthly': return 'Every 2 months';
      case 'quarterly': return 'Every 3 months';
      default: return frequency;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-sm">Active</span>;
      case 'paused':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-sm">Paused</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-sm">Cancelled</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status !== 'cancelled');
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled');

  if (subscriptions.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-light text-foreground mb-6">Subscriptions</h2>
        <div className="bg-muted/20 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You don't have any active subscriptions yet.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Subscribe to your favorite products and save 15% on every order with automatic monthly deliveries.
          </p>
          <Link to="/subscribe">
            <Button>Learn About Subscriptions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-light text-foreground mb-6">Subscriptions</h2>
      
      {activeSubscriptions.length > 0 && (
        <div className="space-y-4 mb-8">
          {activeSubscriptions.map((subscription) => (
            <div key={subscription.id} className="border border-border p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={subscription.product?.image || '/placeholder.svg'}
                    alt={subscription.product?.name || 'Product'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">{subscription.product?.name}</h3>
                      <p className="text-sm text-muted-foreground">{subscription.product?.category}</p>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="text-foreground font-medium">{formatPrice(subscription.price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="text-foreground">{formatFrequency(subscription.frequency)}</p>
                    </div>
                    {subscription.status === 'active' && (
                      <div>
                        <p className="text-muted-foreground">Next Delivery</p>
                        <p className="text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(subscription.next_delivery_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {subscription.status === 'paused' && subscription.paused_at && (
                      <div>
                        <p className="text-muted-foreground">Paused On</p>
                        <p className="text-foreground">
                          {new Date(subscription.paused_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 justify-end flex-wrap">
                {subscription.status === 'active' && (
                    <>
                      <FrequencyChangeDialog
                        subscriptionId={subscription.id}
                        currentFrequency={subscription.frequency}
                        onSuccess={fetchSubscriptions}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSkip(subscription.id)}
                        disabled={updatingId === subscription.id}
                        className="flex items-center gap-1"
                      >
                        <SkipForward className="w-3 h-3" />
                        Skip
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePause(subscription.id)}
                        disabled={updatingId === subscription.id}
                        className="flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" />
                        Pause
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your subscription to {subscription.product?.name}? 
                              You can always subscribe again later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(subscription.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {subscription.status === 'paused' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(subscription.id)}
                        disabled={updatingId === subscription.id}
                        className="flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Resume
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your subscription to {subscription.product?.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(subscription.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelledSubscriptions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Cancelled Subscriptions</h3>
          <div className="space-y-3">
            {cancelledSubscriptions.map((subscription) => (
              <div key={subscription.id} className="border border-border/50 p-4 opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={subscription.product?.image || '/placeholder.svg'}
                      alt={subscription.product?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{subscription.product?.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Cancelled on {subscription.cancelled_at ? new Date(subscription.cancelled_at).toLocaleDateString('en-GB') : 'N/A'}
                    </p>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Need help with your subscriptions? <Link to="/faq" className="text-primary hover:underline">View FAQ</Link> or contact us at <a href="mailto:support@thehealios.com" className="text-primary hover:underline">support@thehealios.com</a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSection;
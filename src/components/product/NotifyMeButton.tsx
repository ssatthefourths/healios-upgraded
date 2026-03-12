import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface NotifyMeButtonProps {
  productId: string;
  productName: string;
  variant?: "default" | "small";
  className?: string;
}

const NotifyMeButton = ({ productId, productName, variant = "default", className = "" }: NotifyMeButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user is already subscribed
  const { data: isSubscribed, isLoading: isCheckingSubscription } = useQuery({
    queryKey: ['stock-notification', productId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('stock_notifications')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('stock_notifications')
        .insert({ product_id: productId, user_id: user.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-notification', productId] });
      toast.success(`We'll notify you when ${productName} is back in stock`);
    },
    onError: () => {
      toast.error('Failed to set up notification');
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('stock_notifications')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-notification', productId] });
      toast.success('Notification removed');
    },
    onError: () => {
      toast.error('Failed to remove notification');
    },
  });

  const handleClick = () => {
    if (!user) {
      toast.info('Please sign in to get notified');
      navigate('/auth');
      return;
    }

    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  };

  const isLoading = isCheckingSubscription || subscribeMutation.isPending || unsubscribeMutation.isPending;

  if (variant === "small") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={`text-xs ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isSubscribed ? (
          <>
            <BellOff className="h-3 w-3 mr-1" />
            Subscribed
          </>
        ) : (
          <>
            <Bell className="h-3 w-3 mr-1" />
            Notify Me
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isSubscribed ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4 mr-2" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      {isSubscribed ? "Remove Notification" : "Notify Me When Available"}
    </Button>
  );
};

export default NotifyMeButton;
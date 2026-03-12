import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  isInWishlist: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'md';
  loading?: boolean;
}

const WishlistButton = ({ 
  isInWishlist, 
  onClick, 
  className, 
  size = 'md',
  loading = false 
}: WishlistButtonProps) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all duration-200 hover:bg-background hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        buttonSize,
        className
      )}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {loading ? (
        <Loader2 className={cn(iconSize, "animate-spin text-muted-foreground")} />
      ) : (
        <Heart
          className={cn(
            iconSize,
            "transition-all duration-200",
            isInWishlist 
              ? "fill-red-500 text-red-500" 
              : "text-foreground hover:text-red-500"
          )}
        />
      )}
    </button>
  );
};

export default WishlistButton;

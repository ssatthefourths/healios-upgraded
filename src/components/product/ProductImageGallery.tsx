import { useState, useRef } from "react";
import ImageZoom from "./ImageZoom";

interface ProductImageGalleryProps {
  productImage: string;
  productName: string;
}

const ProductImageGallery = ({ productImage, productName }: ProductImageGalleryProps) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleImageClick = () => {
    setIsZoomOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Use product image or fallback to placeholder
  const imageUrl = productImage || '/placeholder.svg';
  const productImages = [imageUrl];

  return (
    <div className="w-full">
      {/* Desktop: Single large image */}
      <div className="hidden lg:block">
        <div 
          className="w-full aspect-square overflow-hidden cursor-pointer group"
          onClick={handleImageClick}
        >
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Tablet/Mobile: Single image */}
      <div className="lg:hidden">
        <div className="relative">
          <div 
            className="w-full aspect-square overflow-hidden cursor-pointer group touch-pan-y"
            onClick={handleImageClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
            />
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <ImageZoom
        images={productImages}
        initialIndex={0}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </div>
  );
};

export default ProductImageGallery;

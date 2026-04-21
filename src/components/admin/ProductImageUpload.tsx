import ImageUpload from "./ImageUpload";

interface ProductImageUploadProps {
  currentImage: string;
  productId: string;
  onImageChange: (imageUrl: string) => void;
}

// Thin wrapper around the shared ImageUpload component that namespaces uploads
// under /products and keeps the existing API used by ProductEditor.tsx.
const ProductImageUpload = ({ currentImage, onImageChange }: ProductImageUploadProps) => (
  <ImageUpload
    currentImage={currentImage}
    onImageChange={onImageChange}
    prefix="products"
    label="Product Image"
  />
);

export default ProductImageUpload;

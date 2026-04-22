export interface ProductLike {
  id: string;
  slug?: string | null;
}

export const getProductPath = (product: ProductLike): string =>
  `/product/${product.slug || product.id}`;

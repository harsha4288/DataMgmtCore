// Product-specific types to avoid circular imports

export interface FakeStoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface ProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  image: string;
  images: string[];
  rating: {
    average: number;
    count: number;
    reviews?: ProductReview[];
  };
  inventory: {
    inStock: boolean;
    quantity: number;
    lowStockThreshold: number;
  };
  attributes: ProductAttribute[];
  tags: string[];
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  displayName: string;
  unit?: string;
}
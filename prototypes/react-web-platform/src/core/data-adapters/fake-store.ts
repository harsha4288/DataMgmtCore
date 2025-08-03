// Inline all types to bypass cache issues
interface FakeStoreProduct {
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

interface ProductReview {
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

interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  displayName: string;
  unit?: string;
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

export class FakeStoreAdapter {
  private baseUrl = 'https://fakestoreapi.com'

  async getProducts(): Promise<ProductData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/products`)
      const products: FakeStoreProduct[] = await response.json()
      
      return products.map(this.transformProduct)
    } catch (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }
  }

  async getLargeProductDataset(multiplier: number = 25): Promise<ProductData[]> {
    const baseProducts = await this.getProducts()
    const largeDataset: ProductData[] = []
    
    for (let i = 0; i < multiplier; i++) {
      baseProducts.forEach((product, index) => {
        largeDataset.push({
          ...product,
          id: `${i}-${product.id}`,
          title: `${product.title} (Variant ${i + 1})`,
          sku: `SKU-${i}-${index + 1}`,
          price: Math.round((product.price + Math.random() * 10) * 100) / 100,
          inventory: {
            ...product.inventory,
            quantity: Math.floor(Math.random() * 100) + 1
          }
        })
      })
    }
    
    return largeDataset
  }

  private transformProduct = (fakeStoreProduct: FakeStoreProduct): ProductData => {
    const hasDiscount = Math.random() > 0.7
    const discount = hasDiscount ? Math.floor(Math.random() * 30) + 5 : 0
    const originalPrice = hasDiscount ? Math.round(fakeStoreProduct.price * 1.2 * 100) / 100 : undefined
    
    return {
      id: fakeStoreProduct.id.toString(),
      title: fakeStoreProduct.title,
      description: fakeStoreProduct.description,
      price: fakeStoreProduct.price,
      originalPrice,
      discount,
      category: fakeStoreProduct.category,
      brand: this.generateBrand(fakeStoreProduct.category),
      sku: `SKU-${fakeStoreProduct.id}`,
      image: fakeStoreProduct.image,
      images: [fakeStoreProduct.image],
      rating: {
        average: fakeStoreProduct.rating.rate,
        count: fakeStoreProduct.rating.count
      },
      inventory: {
        inStock: Math.random() > 0.1,
        quantity: Math.floor(Math.random() * 100) + 1,
        lowStockThreshold: 10
      },
      attributes: [],
      tags: [fakeStoreProduct.category],
      status: Math.random() > 0.05 ? 'active' : (Math.random() > 0.5 ? 'inactive' : 'discontinued')
    }
  }

  private generateBrand(category: string): string {
    const brands: Record<string, string[]> = {
      "men's clothing": ["Nike", "Adidas", "Levi's", "Calvin Klein"],
      "women's clothing": ["Zara", "H&M", "Forever 21", "Urban Outfitters"],
      "electronics": ["Apple", "Samsung", "Sony", "LG"],
      "jewelery": ["Tiffany & Co.", "Pandora", "Kay Jewelers", "Blue Nile"]
    }
    
    const categoryBrands = brands[category] || ["Generic Brand"]
    return categoryBrands[Math.floor(Math.random() * categoryBrands.length)]
  }
}
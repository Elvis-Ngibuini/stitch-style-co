export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Admin';
  isEmailVerified: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory: string | null;
}

export interface ProductVariant {
  _id: string;
  size: string;
  color: string;
  SKU: string;
  stockQuantity: number;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  basePrice: number;
  images: string[];
  variants: ProductVariant[];
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}

export interface CartItem {
  _id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  priceAtTimeOfAdd: number;
}

export interface Cart {
  _id: string;
  user: string | null;
  sessionId: string | null;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  product: Product;
  productSnapshot: {
    title: string;
    description: string;
    basePrice: number;
    images: string[];
  };
  variant: {
    size: string;
    color: string;
    SKU: string;
  };
  quantity: number;
  priceAtTimeOfPurchase: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  fulfillmentStatus: 'Processing' | 'Shipped' | 'Delivered';
  paymentIntentId: string | null;
  couponApplied: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  user: User;
  product: Product;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Wishlist {
  _id: string;
  user: string;
  products: Product[];
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expirationDate: string;
  usageLimit: number;
  usedCount: number;
}

export interface ApiError {
  message: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}
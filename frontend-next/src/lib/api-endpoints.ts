import { api, type ApiClientError } from './api';
import type {
  Product,
  ProductsResponse,
  Category,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Review,
  Wishlist,
  Coupon,
  User,
  PaginatedResponse,
} from '@/types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<User>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<User>('/auth/login', data),

  refresh: () => api.post<{ message: string }>('/auth/refresh'),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  logoutAll: () => api.post<{ message: string }>('/auth/logout-all'),

  getMe: () => api.get<User>('/auth/me'),
};

export const productApi = {
  getProducts: (params?: {
    page?: number;
    category?: string;
    size?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) =>
    api.get<ProductsResponse>('/products', params as Record<string, string>),

  getProductById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  createProduct: (data: Partial<Product>) =>
    api.post<Product>('/products', data),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete<{ message: string }>(`/products/${id}`),
};

export const categoryApi = {
  getCategories: () =>
    api.get<Category[]>('/categories'),

  createCategory: (data: { name: string; slug: string; parentCategory?: string }) =>
    api.post<Category>('/categories', data),

  updateCategory: (id: string, data: { name?: string; slug?: string; parentCategory?: string }) =>
    api.put<Category>(`/categories/${id}`, data),

  deleteCategory: (id: string) =>
    api.delete<{ message: string }>(`/categories/${id}`),
};

export const cartApi = {
  getCart: () =>
    api.get<Cart>('/cart'),

  addToCart: (data: { productId: string; variantId: string; quantity: number }) =>
    api.post<Cart>('/cart', data),

  updateCartItem: (data: { itemId: string; quantity: number }) =>
    api.put<Cart>('/cart', data),

  removeFromCart: (itemId: string) =>
    api.delete<Cart>(`/cart/${itemId}`),
};

export const wishlistApi = {
  getWishlist: () =>
    api.get<Wishlist>('/wishlist'),

  addToWishlist: (productId: string) =>
    api.post<Wishlist>('/wishlist', { productId }),

  removeFromWishlist: (productId: string) =>
    api.delete<Wishlist>(`/wishlist/${productId}`),
};

export const orderApi = {
  createPaymentIntent: (data: {
    shippingAddress: Order['shippingAddress'];
    couponCode?: string;
    sessionId?: string;
  }) =>
    api.post<{ clientSecret: string; orderId: string }>('/orders/create-payment-intent', data),

  getOrders: () =>
    api.get<Order[]>('/orders'),

  getOrderById: (id: string) =>
    api.get<Order>(`/orders/${id}`),

  updateOrderStatus: (id: string, fulfillmentStatus: Order['fulfillmentStatus']) =>
    api.put<Order>(`/orders/${id}/status`, { fulfillmentStatus }),

  getDashboardStats: () =>
    api.get<{
      totalSales: number;
      totalOrders: number;
      lowStockProducts: Array<{
        _id: string;
        title: string;
        lowStockVariants: Array<{ size: string; color: string; stock: number }>;
      }>;
    }>('/orders/dashboard/stats'),
};

export const reviewApi = {
  getReviewsByProduct: (productId: string) =>
    api.get<Review[]>(`/reviews/product/${productId}`),

  createReview: (data: { product: string; rating: number; comment: string }) =>
    api.post<Review>('/reviews', data),
};

export const couponApi = {
  getCoupons: () =>
    api.get<Coupon[]>('/coupons'),

  createCoupon: (data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    expirationDate: string;
    usageLimit?: number;
  }) =>
    api.post<Coupon>('/coupons', data),

  updateCoupon: (id: string, data: Partial<Coupon>) =>
    api.put<Coupon>(`/coupons/${id}`, data),

  deleteCoupon: (id: string) =>
    api.delete<{ message: string }>(`/coupons/${id}`),
};

export const adminApi = {
  getProducts: (params?: { page?: number; search?: string }) =>
    api.get<ProductsResponse>('/admin/products', params as Record<string, string>),

  createProduct: (data: Partial<Product>) =>
    api.post<Product>('/admin/products', data),

  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/admin/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete<{ message: string }>(`/admin/products/${id}`),

  getOrders: (params?: { page?: number; status?: string }) =>
    api.get<Order[]>('/admin/orders', params as Record<string, string>),

  updateOrderStatus: (id: string, fulfillmentStatus: Order['fulfillmentStatus']) =>
    api.put<Order>(`/admin/orders/${id}/status`, { fulfillmentStatus }),

  getUsers: (params?: { page?: number; search?: string }) =>
    api.get<User[]>('/admin/users', params as Record<string, string>),

  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete<{ message: string }>(`/admin/users/${id}`),

  getDashboardStats: () =>
    api.get<{
      totalSales: number;
      totalOrders: number;
      lowStockProducts: Array<{
        _id: string;
        title: string;
        lowStockVariants: Array<{ size: string; color: string; stock: number }>;
      }>;
    }>('/admin/stats'),
};

export { ApiClientError } from './api';
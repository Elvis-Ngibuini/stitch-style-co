'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { orderApi } from '@/lib/api-endpoints';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Loading';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { formatPrice } from '@/lib/utils';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrder();
    }
  }, [isAuthenticated, orderId]);

  const fetchOrder = async () => {
    try {
      const data = await orderApi.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) return null;

  if (!order) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <Link href="/account/orders">
              <Button>View My Orders</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You for Your Order!</h1>
            <p className="text-gray-600">Your order has been confirmed and is being processed.</p>
          </div>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Confirmation</CardTitle>
              <Badge variant="success">Confirmed</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-mono font-medium text-gray-900">{order._id?.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <Badge variant="success">{order.paymentStatus}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fulfillment Status</p>
                  <Badge variant={order.fulfillmentStatus === 'Delivered' ? 'success' : 'default'}>{order.fulfillmentStatus}</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="relative h-16 w-12 flex-shrink-0 rounded bg-gray-100 overflow-hidden">
                        {item.productSnapshot.images[0] && (
                          <img src={item.productSnapshot.images[0]} alt={item.productSnapshot.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.productSnapshot.title}</p>
                        <p className="text-sm text-gray-500">{item.variant.size} / {item.variant.color}</p>
                        <p className="text-sm font-medium text-gray-900">{formatPrice(item.priceAtTimeOfPurchase / 100)} × {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice((order.totalAmount || 0) / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium">{order.shippingAddress ? 'Calculated' : 'Free'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice((order.totalAmount || 0) / 100)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress && (
                <address className="not-italic text-gray-700">
                  <p className="font-medium">{order.shippingAddress.street}</p>
                  {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </address>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/orders">
              <Button variant="outline">View Order Details</Button>
            </Link>
            <Link href="/shop/men">
              <Button>Continue Shopping</Button>
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api-endpoints';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner, Skeleton } from '@/components/ui/Loading';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  Paid: 'success',
  Pending: 'warning',
  Failed: 'danger',
  Processing: 'info',
  Shipped: 'default',
  Delivered: 'success',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders({ page: page.toString() });
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status] || 'default';
    return <Badge variant={color}>{status}</Badge>;
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

  if (!isAdmin) return null;

  return (
    <>
      <Header />
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="mt-1 text-gray-600">Manage customer orders</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Fulfillment</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm text-gray-900">
                            {order._id?.slice(-8).toUpperCase()}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-gray-900">{order.user?.name || 'Guest'}</p>
                            <p className="text-sm text-gray-500">{order.user?.email || 'N/A'}</p>
                          </td>
                          <td className="p-4 font-medium text-gray-900">
                            {formatPrice((order.totalAmount || 0) / 100)}
                          </td>
                          <td className="p-4">{getStatusBadge(order.paymentStatus)}</td>
                          <td className="p-4">{getStatusBadge(order.fulfillmentStatus)}</td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Link href={`/admin/orders/${order._id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
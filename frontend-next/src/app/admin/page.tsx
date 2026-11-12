'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api-endpoints';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner, Skeleton } from '@/components/ui/Loading';
import { formatPrice } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  if (!isAdmin) return null;

  const statCards = [
    { title: 'Total Products', value: stats?.totalProducts || 0, icon: '📦', color: 'bg-blue-100 text-blue-700' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: '📋', color: 'bg-green-100 text-green-700' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-purple-100 text-purple-700' },
    { title: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: '💰', color: 'bg-yellow-100 text-yellow-700' },
  ];

  return (
    <>
      <Header />
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-gray-600">Overview of your store performance</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/products">
                  <Button className="w-full justify-start gap-3" variant="outline">
                    <span>📦</span>
                    <span>Manage Products</span>
                  </Button>
                </Link>
                <Link href="/admin/orders">
                  <Button className="w-full justify-start gap-3" variant="outline">
                    <span>📋</span>
                    <span>Manage Orders</span>
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button className="w-full justify-start gap-3" variant="outline">
                    <span>👥</span>
                    <span>Manage Users</span>
                  </Button>
                </Link>
                <Link href="/admin/coupons">
                  <Button className="w-full justify-start gap-3" variant="outline">
                    <span>🎫</span>
                    <span>Manage Coupons</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentOrders?.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentOrders.slice(0, 5).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Order {order._id?.slice(-8)}</p>
                          <p className="text-sm text-gray-600">{order.user?.name || 'Guest'} • {formatPrice(order.totalAmount / 100)}</p>
                        </div>
                        <Badge variant={order.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent orders</p>
                )}
              </CardContent>
            </Card>
          </div>

          {stats?.lowStockProducts?.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Variant</th>
                        <th className="pb-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.lowStockProducts.flatMap((product) =>
                        product.lowStockVariants.map((variant) => (
                          <tr key={`${product._id}-${variant.size}-${variant.color}`} className="border-b">
                            <td className="py-3 font-medium text-gray-900">{product.title}</td>
                            <td className="py-3 text-gray-600">{variant.size} / {variant.color}</td>
                            <td className="py-3">
                              <Badge variant="danger">{variant.stock} left</Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
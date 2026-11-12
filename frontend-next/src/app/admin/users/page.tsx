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

const ROLE_COLORS: Record<string, 'success' | 'default'> = {
  Admin: 'success',
  Customer: 'default',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({ page: page.toString() });
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  return (
    <>
      <Header />
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-gray-600">Manage customer accounts</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="p-4">User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900">{user.name}</td>
                          <td className="p-4 text-gray-600">{user.email}</td>
                          <td className="p-4">
                            <Badge variant={ROLE_COLORS[user.role] || 'default'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Link href={`/admin/users/${user._id}`}>
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
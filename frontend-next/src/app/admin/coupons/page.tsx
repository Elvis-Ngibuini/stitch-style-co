'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { couponApi, adminApi } from '@/lib/api-endpoints';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner, Skeleton } from '@/components/ui/Loading';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { formatPrice } from '@/lib/utils';

export default function AdminCouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    expirationDate: '',
    usageLimit: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchCoupons();
    }
  }, [isAdmin, page]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponApi.getCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createCoupon({
        code: formData.code,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        expirationDate: formData.expirationDate,
        usageLimit: Number(formData.usageLimit),
      });
      setCreateModalOpen(false);
      setFormData({ code: '', discountType: 'percentage', discountValue: '', expirationDate: '', usageLimit: 1 });
      fetchCoupons();
    } catch (error) {
      console.error('Failed to create coupon:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (error) {
      console.error('Failed to delete coupon:', error);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
              <p className="mt-1 text-gray-600">Manage discount codes</p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>Create Coupon</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="p-4">Code</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Value</th>
                      <th className="p-4">Expires</th>
                      <th className="p-4">Usage</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No coupons found
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-gray-50">
                          <td className="p-4 font-mono font-medium text-gray-900">{coupon.code}</td>
                          <td className="p-4 capitalize">{coupon.discountType}</td>
                          <td className="p-4 font-medium text-gray-900">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : formatPrice(coupon.discountValue)}
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(coupon.expirationDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-gray-600">
                            {coupon.usedCount} / {coupon.usageLimit}
                          </td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon._id)}>
                              Delete
                            </Button>
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

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Coupon"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="SAVE20"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Discount Value"
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
              placeholder="20"
              required
              min="1"
            />
            <Input
              label="Usage Limit"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="100"
              required
              min="1"
            </div>
          </div>
          <Input
            label="Expiration Date"
            type="date"
            value={formData.expirationDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                value="percentage"
                checked={formData.discountType === 'percentage'}
                onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-900">Percentage</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountType"
                value="fixed"
                checked={formData.discountType === 'fixed'}
                onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-900">Fixed Amount</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
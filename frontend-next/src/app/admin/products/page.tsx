'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminApi, productApi } from '@/lib/api-endpoints';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner, Skeleton } from '@/components/ui/Loading';
import { ProductGrid, Pagination } from '@/components/product/ProductGrid';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin, page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString() };
      if (search) params.search = search;
      
      const data = await adminApi.getProducts(params);
      setProducts(data.products);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete product:', error);
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
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="mt-1 text-gray-600">Manage your product catalog</p>
            </div>
            <Link href="/admin/products/new">
              <Button>Add Product</Button>
            </Link>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="flex-1 max-w-md"
                />
                <Button onClick={fetchProducts} variant="outline">Search</Button>
              </div>
            </CardContent>
          </Card>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <Spinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-500">Get started by adding your first product.</p>
              <Link href="/admin/products/new" className="mt-4 inline-block">
                <Button>Add Product</Button>
              </Link>
            </div>
          ) : (
            <>
              <ProductGrid products={products} />
              {pagination.pages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={(newPage) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('page', newPage.toString());
                    router.push(`/admin/products?${params.toString()}`);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => productToDelete && handleDelete(productToDelete)} loading={loading}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
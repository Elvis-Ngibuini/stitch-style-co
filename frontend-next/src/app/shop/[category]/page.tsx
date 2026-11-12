'use client';

import { useSearchParams } from 'next/navigation';
import { ProductGrid, Pagination } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Spinner } from '@/components/ui/Loading';
import { cn, formatPrice } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
];

const categoryMetadata: Record<string, { title: string; description: string }> = {
  men: { title: "Men's Collection", description: 'Modern menswear - shirts, trousers, outerwear, and accessories' },
  women: { title: "Women's Collection", description: 'Elegant womenswear - dresses, tops, bottoms, and outerwear' },
  kids: { title: "Kids' Collection", description: 'Playful kidswear for boys and girls' },
  sale: { title: 'Sale', description: 'Up to 50% off selected items' },
  new: { title: 'New Arrivals', description: 'Fresh styles just landed' },
};

interface ShopPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const sort = (resolvedSearchParams.sort as string) || 'newest';
  const size = resolvedSearchParams.size ? (Array.isArray(resolvedSearchParams.size) ? resolvedSearchParams.size : [resolvedSearchParams.size]) : [];
  const color = resolvedSearchParams.color ? (Array.isArray(resolvedSearchParams.color) ? resolvedSearchParams.color : [resolvedSearchParams.color]) : [];
  const minPrice = resolvedSearchParams.minPrice ? Number(resolvedSearchParams.minPrice) : undefined;
  const maxPrice = resolvedSearchParams.maxPrice ? Number(resolvedSearchParams.maxPrice) : undefined;

  const meta = categoryMetadata[category] || { title: 'Shop', description: 'Browse our collection' };

  let products: Awaited<ReturnType<typeof import('@/lib/api-endpoints').productApi.getProducts>>['products'] = [];
  let totalPages = 1;
  let total = 0;

  try {
    const response = await import('@/lib/api-endpoints').productApi.getProducts({
      page,
      category: category !== 'all' ? category : undefined,
      sort,
      size: size.join(','),
      color: color.join(','),
      minPrice,
      maxPrice,
    });
    products = response.products;
    totalPages = response.pages;
    total = response.total;
  } catch {
    products = [];
  }

  return (
    <>
      <Header />
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-gray-900">Home</Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-gray-900">Shop</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium" aria-current="page">{meta.title}</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">{meta.title}</h1>
            <p className="mt-2 text-gray-600">{meta.description}</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <FiltersPanel
                  category={category}
                  sort={sort}
                  selectedSizes={size}
                  selectedColors={color}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{products.length > 0 ? ((page - 1) * 12) + 1 : 0}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 12, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> products
                </div>
                <select
                  value={sort}
                  onChange={(e) => {
                    const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                    params.set('sort', e.target.value);
                    params.set('page', '1');
                    window.location.search = params.toString();
                  }}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16">
                  <Spinner size="lg" className="mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your filters or search terms.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = `/shop/${category}`}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <ProductGrid products={products} />
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(newPage) => {
                        const params = new URLSearchParams(resolvedSearchParams as Record<string, string>);
                        params.set('page', newPage.toString());
                        window.location.search = params.toString();
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function FiltersPanel({ 
  category, 
  sort, 
  selectedSizes, 
  selectedColors, 
  minPrice, 
  maxPrice 
}: { 
  category: string; 
  sort: string; 
  selectedSizes: string[]; 
  selectedColors: string[]; 
  minPrice?: number; 
  maxPrice?: number; 
}) {
  const [expanded, setExpanded] = useState({ size: true, color: true, price: true });

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    const current = params.getAll(key);
    
    if (current.includes(value)) {
      params.delete(key);
      current.filter(v => v !== value).forEach(v => params.append(key, v));
    } else {
      params.append(key, value);
    }
    params.set('page', '1');
    window.location.search = params.toString();
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(type === 'min' ? 'minPrice' : 'maxPrice', value);
    } else {
      params.delete(type === 'min' ? 'minPrice' : 'maxPrice');
    }
    params.set('page', '1');
    window.location.search = params.toString();
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', '30', '32', '34', '36'];
  const colors = ['Black', 'White', 'Navy', 'Gray', 'Brown', 'Cream', 'Burgundy', 'Pink', 'Blue', 'Khaki'];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={() => window.location.search = ''}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear All
        </button>
      </div>

      <FilterSection title="Size" key="size" expanded={expanded.size} onToggle={() => setExpanded(prev => ({ ...prev, size: !prev.size }))}>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleFilterChange('size', size)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedSizes.includes(size)
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Color" key="color" expanded={expanded.color} onToggle={() => setExpanded(prev => ({ ...prev, color: !prev.color }))}>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleFilterChange('color', color)}
              className={cn(
                'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedColors.includes(color)
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              )}
            >
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color.toLowerCase() }} />
              {color}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price" key="price" expanded={expanded.price} onToggle={() => setExpanded(prev => ({ ...prev, price: !prev.price }))}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">$</span>
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            min="0"
            max="1000"
          />
          <span className="text-sm text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            min="0"
            max="1000"
          />
          <span className="text-sm text-gray-500">$</span>
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, key, expanded, onToggle, children }: { 
  title: string; 
  key: string; 
  expanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode; 
}) {
  return (
    <div className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2"
        aria-expanded={expanded}
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg 
          className={cn('w-5 h-5 text-gray-500 transition-transform', expanded && 'rotate-180')} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div className="mt-4 animate-slide-down">{children}</div>}
    </div>
  );
}

import { useState } from 'react';
import Link from 'next/link';
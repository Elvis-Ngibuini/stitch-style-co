'use client';

import { ProductCard } from './ProductCard';
import { Spinner, Skeleton } from '@/components/ui/Loading';
import type { Product, ProductsResponse } from '@/types';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ProductGrid({ products, loading = false, emptyMessage = 'No products found', className }: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ArticleSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{emptyMessage}</h3>
        <p className="mt-2 text-gray-500">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
      {products.map((product, index) => (
        <ProductCard key={product._id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <Skeleton variant="rectangular" className="aspect-[3/4] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="1/4" />
        <Skeleton variant="text" width="3/4" />
        <Skeleton variant="text" width="1/2" />
        <Skeleton variant="text" width="1/3" />
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="circular" width="24px" height="24px" />
          ))}
        </div>
      </div>
    </article>
  );
}

import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageSize?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange, showPageSize, pageSize, onPageSizeChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(page => 
    page === 1 || 
    page === totalPages || 
    (page >= currentPage - 1 && page <= currentPage + 1)
  );

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4" aria-label="Pagination">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Page {currentPage} of {totalPages}</span>
        {showPageSize && pageSize && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Items per page"
          >
            {[12, 24, 48, 96].map((size) => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {visiblePages.map((page, index) => {
          const prevPage = visiblePages[index - 1];
          const showEllipsis = prevPage && page - prevPage > 1;

          return (
            <React.Fragment key={page}>
              {showEllipsis && (
                <span className="px-3 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                className={cn(
                  'w-10 h-10 rounded-lg font-medium transition-colors',
                  page === currentPage
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </React.Fragment>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

import React from 'react';
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
  priority?: boolean;
}

export function ProductCard({ product, variant = 'default', priority = false }: ProductCardProps) {
  const primaryImage = product.images[0];
  const minPrice = Math.min(...product.variants.map(v => v.basePrice || v.SKU && 0));
  const maxPrice = Math.max(...product.variants.map(v => v.basePrice || v.SKU && 0));
  const hasVariants = product.variants.length > 1;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const isLowStock = totalStock > 0 && totalStock <= 10;
  const isOutOfStock = totalStock === 0;

  if (variant === 'compact') {
    return (
      <Link
        href={`/product/${product._id}`}
        className="flex gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {primaryImage && (
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
          <p className="text-sm text-gray-500">{formatPrice(product.basePrice)}</p>
        </div>
      </Link>
    );
  }

  return (
    <article className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link href={`/product/${product._id}`} className="block" aria-label={product.title}>
        <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
          {primaryImage && (
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {(isLowStock || isOutOfStock) && (
            <div className="absolute top-3 left-3 z-10">
              <Badge
                variant={isOutOfStock ? 'danger' : 'warning'}
                size="sm"
              >
                {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full bg-white/90 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Button>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {product.category?.name}
          </p>
          {hasVariants && (
            <Badge variant="outline" size="sm">
              {product.variants.length} variants
            </Badge>
          )}
        </div>

        <Link href={`/product/${product._id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.basePrice)}
          </span>
        </div>

        {product.variants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Available colors">
            {product.variants
              .filter((v, i, arr) => arr.findIndex(v2 => v2.color === v.color) === i)
              .slice(0, 5)
              .map((variant) => (
                <span
                  key={variant.color}
                  className="w-6 h-6 rounded-full border border-gray-200"
                  style={{ backgroundColor: variant.color.toLowerCase() }}
                  title={variant.color}
                  aria-label={`Color: ${variant.color}`}
                />
              ))}
            {product.variants.length > 5 && (
              <span className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-600">
                +{product.variants.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
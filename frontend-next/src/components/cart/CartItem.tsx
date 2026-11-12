'use client';

import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/types';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, variant, quantity, priceAtTimeOfAdd } = item;
  const primaryImage = product.images[0];
  const lineTotal = priceAtTimeOfAdd * quantity;
  const maxQuantity = variant.stockQuantity;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <Link href={`/product/${product._id}`} className="relative h-24 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/product/${product._id}`}>
          <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500">
          {variant.color} / {variant.size}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900">
          {formatPrice(priceAtTimeOfAdd)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item._id, Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            aria-label="Decrease quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1));
              onUpdateQuantity(item._id, val);
            }}
            min={1}
            max={maxQuantity}
            className="w-14 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Quantity"
          />
          <button
            onClick={() => onUpdateQuantity(item._id, Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            aria-label="Increase quantity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-900">
          {formatPrice(lineTotal)}
        </p>

        <button
          onClick={() => onRemove(item._id)}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

import Link from 'next/link';
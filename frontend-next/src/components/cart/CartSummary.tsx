'use client';

import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
  onApplyCoupon: (code: string) => void;
  couponCode?: string;
  discount?: number;
  loading?: boolean;
}

export function CartSummary({ 
  subtotal, 
  itemCount, 
  onCheckout, 
  onApplyCoupon, 
  couponCode, 
  discount = 0,
  loading = false 
}: CartSummaryProps) {
  const [couponInput, setCouponInput] = useState('');
  const shipping = subtotal > 200 ? 0 : 15;
  const total = subtotal - discount + shipping;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Subtotal ({itemCount} items)</dt>
          <dd className="font-medium text-gray-900">{formatPrice(subtotal)}</dd>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <dt>Discount</dt>
            <dd className="font-medium">-{formatPrice(discount)}</dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-gray-600">Shipping</dt>
          <dd className="font-medium text-gray-900">
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </dd>
        </div>

        {subtotal > 0 && subtotal < 200 && (
          <p className="text-xs text-gray-500">
            Add {formatPrice(200 - subtotal)} more for free shipping
          </p>
        )}

        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-gray-900">{formatPrice(total)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-6 space-y-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Coupon code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            className="pr-24"
            disabled={loading}
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => couponInput.trim() && onApplyCoupon(couponInput.trim())}
            disabled={loading || !couponInput.trim()}
          >
            Apply
          </Button>
        </div>

        {couponCode && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>Coupon applied: {couponCode}</span>
            <button
              onClick={() => onApplyCoupon('')}
              className="text-xs underline hover:text-green-700"
            >
              Remove
            </button>
          </div>
        )}

        <Button size="xl" fullWidth onClick={onCheckout} disabled={loading || itemCount === 0}>
          Proceed to Checkout
        </Button>

        <p className="text-center text-xs text-gray-500">
          Secure checkout powered by Stripe
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Secure SSL encrypted checkout</span>
        </div>
        <div className="mt-3 flex gap-4 text-gray-400">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 7.25V21a2 2 0 01-2 2H5a2 2 0 01-2-2V7.25c0-.87.78-1.6 1.75-1.73l7.1-1.5a2 2 0 011.5 0l7.1 1.5c.97.13 1.75.86 1.75 1.73z" /></svg>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-7.58 3.12A1 1 0 004 7.12V17a1 1 0 001.42.99A10 10 0 0012 22a10 10 0 007.58-3.12A1 1 0 0020 17V7.12a1 1 0 00-1.42-.99A10 10 0 0012 2z" /></svg>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.5 10.5h19M12 16.5v-6m0 0l-4 4m4-4l4 4" /></svg>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
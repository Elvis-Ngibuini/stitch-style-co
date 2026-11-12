'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartItemComponent } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Spinner, LoadingOverlay } from '@/components/ui/Loading';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { cart, loading, itemCount, subtotal, updateQuantity, removeFromCart, refreshCart } = useCart();

  const handleApplyCoupon = (code: string) => {
    console.log('Apply coupon:', code);
  };

  const handleCheckout = () => {
    console.log('Proceed to checkout');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center">
          <Spinner size="lg" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="mt-1 text-gray-600">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {itemCount === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Your cart is empty</h2>
              <p className="mt-2 text-gray-500">Looks like you haven't added any items yet.</p>
              <Link href="/shop/men" className="mt-6 inline-block">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {cart?.items.map((item) => (
                      <CartItemComponent
                        key={item._id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Link
                    href="/shop/men"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                  </Link>
                  <Button variant="ghost" onClick={refreshCart}>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Cart
                  </Button>
                </div>
              </div>

              <div>
                <CartSummary
                  subtotal={subtotal}
                  itemCount={itemCount}
                  onCheckout={handleCheckout}
                  onApplyCoupon={handleApplyCoupon}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
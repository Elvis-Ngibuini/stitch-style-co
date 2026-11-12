'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Loading';
import { useCart } from '@/context/CartContext';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const { addToCart, loading: cartLoading } = useCart();

  const inStockVariants = product.variants.filter(v => v.stockQuantity > 0);
  const isOutOfStock = inStockVariants.length === 0;
  const colors = [...new Set(product.variants.map(v => v.color))];
  const sizes = [...new Set(product.variants.map(v => v.size))];

  const handleVariantSelect = (color: string, size: string) => {
    const variant = product.variants.find(v => v.color === color && v.size === size);
    if (variant && variant.stockQuantity > 0) {
      setSelectedVariant(variant);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addToCart(product._id, selectedVariant._id, quantity);
  };

  const selectedColor = selectedVariant?.color || colors[0];
  const availableSizesForColor = sizes.filter(size => 
    product.variants.some(v => v.color === selectedColor && v.size === size && v.stockQuantity > 0)
  );

  return (
    <div className="py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gray-900">Home</Link>
        <span>/</span>
        <Link href={`/shop/${product.category?.slug}`} className="hover:text-gray-900">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium" aria-current="page">{product.title}</span>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowImageModal(true)}
                className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                aria-label="View full size image"
              />
              {product.images[selectedImageIndex] && (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Product images">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                      index === selectedImageIndex
                        ? 'border-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    )}
                    aria-label={`View image ${index + 1}`}
                    aria-current={index === selectedImageIndex ? 'true' : 'false'}
                    role="listitem"
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <Modal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            size="xl"
            showCloseButton
          >
            <div className="relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden">
              {product.images[selectedImageIndex] && (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                  fill
                  priority
                  className="object-cover"
                />
              )}
            </div>
            <div className="mt-4 flex justify-center gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    'h-16 w-16 rounded-lg overflow-hidden border-2 transition-all',
                    index === selectedImageIndex
                      ? 'border-gray-900'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          </Modal>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {product.category?.name}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              {product.title}
            </h1>
            <p className="mt-4 text-lg font-bold text-gray-900">
              {formatPrice(product.basePrice)}
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600">{product.description}</p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color options">
                {colors.map((color) => {
                  const hasStock = product.variants.some(v => v.color === color && v.stockQuantity > 0);
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        if (hasStock) {
                          const firstSize = sizes.find(s => 
                            product.variants.some(v => v.color === color && v.size === s && v.stockQuantity > 0)
                          );
                          if (firstSize) handleVariantSelect(color, firstSize);
                        }
                      }}
                      disabled={!hasStock}
                      className={cn(
                        'relative px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                        selectedColor === color && hasStock
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : hasStock
                          ? 'border-gray-300 hover:border-gray-400 text-gray-900'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                      role="radio"
                      aria-checked={selectedColor === color}
                      aria-disabled={!hasStock}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size options">
                {sizes.map((size) => {
                  const hasStock = product.variants.some(
                    v => v.color === selectedColor && v.size === size && v.stockQuantity > 0
                  );
                  const variant = product.variants.find(
                    v => v.color === selectedColor && v.size === size
                  );
                  const isSelected = selectedVariant?.size === size && selectedVariant?.color === selectedColor;
                  return (
                    <button
                      key={size}
                      onClick={() => hasStock && handleVariantSelect(selectedColor, size)}
                      disabled={!hasStock}
                      className={cn(
                        'h-12 w-12 rounded-lg border-2 text-sm font-medium transition-all',
                        isSelected && hasStock
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : hasStock
                          ? 'border-gray-300 hover:border-gray-400 text-gray-900'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed line-through'
                      )}
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={!hasStock}
                      title={hasStock ? undefined : 'Out of stock'}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedVariant && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {selectedVariant.color} / {selectedVariant.size}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      SKU: {selectedVariant.SKU}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-medium',
                      selectedVariant.stockQuantity <= 10 && selectedVariant.stockQuantity > 0
                        ? 'text-yellow-600'
                        : selectedVariant.stockQuantity === 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    )}>
                      {selectedVariant.stockQuantity === 0
                        ? 'Out of Stock'
                        : selectedVariant.stockQuantity <= 10
                        ? `Only ${selectedVariant.stockQuantity} left`
                        : 'In Stock'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={selectedVariant?.stockQuantity || 99}
                  className="w-16 text-center border-none focus:outline-none"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant?.stockQuantity || 99, quantity + 1))}
                  disabled={selectedVariant && quantity >= selectedVariant.stockQuantity}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  aria-label="Increase quantity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                size="xl"
                fullWidth
                onClick={handleAddToCart}
                disabled={isOutOfStock || !selectedVariant || cartLoading}
                loading={cartLoading}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="w-16"
                aria-label="Add to wishlist"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900">{product.category?.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Variants Available</dt>
                <dd className="font-medium text-gray-900">{product.variants.length}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Colors</dt>
                <dd className="font-medium text-gray-900">{colors.join(', ')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Sizes</dt>
                <dd className="font-medium text-gray-900">{sizes.join(', ')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
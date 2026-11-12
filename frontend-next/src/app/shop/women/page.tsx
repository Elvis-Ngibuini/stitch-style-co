'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProducts, type Product } from '@/lib/api';

export default function WomenShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts(1, 'women', 2000);
        setProducts(data.products);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Women's Collection</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link key={product._id} href={`/product/${product._id}`} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-64 w-full">
              {product.images[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              <p className="text-gray-600 mb-2">${product.basePrice}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

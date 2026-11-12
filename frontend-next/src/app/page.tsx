import { Metadata } from 'next';
import { productApi } from '@/lib/api-endpoints';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Loading';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Premium Clothing Store',
  description: 'Quality fashion for men, women, and kids. Shop the latest collections.',
};

const categories = [
  { name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea5f?w=800', description: 'Modern menswear' },
  { name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', description: 'Elegant womenswear' },
  { name: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800', description: 'Playful kidswear' },
];

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof productApi.getProducts>>['products'] = [];
  try {
    const response = await productApi.getProducts({ page: 1 });
    products = response.products.slice(0, 8);
  } catch {
    products = [];
  }

  return (
    <>
      <Header />
      <main>
        <section className="relative h-[70vh] min-h-[500px] max-h-[700px] flex items-center">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600"
              alt="Stitch & Style Co Collection"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gray-900/40" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                Crafted for{' '}
                <span className="font-serif italic">Timeless Style</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-200">
                Discover premium clothing designed for the modern wardrobe. Quality craftsmanship meets contemporary design.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/shop/men">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                    Shop Men
                  </Button>
                </Link>
                <Link href="/shop/women">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Shop Women
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="mt-2 text-gray-600">Explore our curated collections</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop/${category.slug}`}
                  className="relative group block aspect-[4/5] rounded-xl overflow-hidden bg-gray-100"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    <p className="mt-1 text-gray-200">{category.description}</p>
                    <span className="mt-3 inline-block text-white font-medium group-hover:underline">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
                <p className="mt-2 text-gray-600">Fresh styles just landed</p>
              </div>
              <Link href="/shop/new">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Join Our Community</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive offers, early access to new collections, and style inspiration.
            </p>
            <form className="max-w-md mx-auto flex gap-2" action="/api/newsletter" method="POST">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Button type="submit" size="lg">Subscribe</Button>
            </form>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <FeatureIcon
                icon={<TruckIcon />}
                title="Free Shipping"
                description="On orders over $200"
              />
              <FeatureIcon
                icon={<ShieldIcon />}
                title="Secure Payment"
                description="100% secure checkout"
              />
              <FeatureIcon
                icon={<RotateIcon />}
                title="Easy Returns"
                description="30-day return policy"
              />
              <FeatureIcon
                icon={<SupportIcon />}
                title="24/7 Support"
                description="Dedicated customer care"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProductCardSkeleton() {
  return (
    <article className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
        <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
        <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    </article>
  );
}

function FeatureIcon({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4">
      <div className="mx-auto w-12 h-12 text-gray-900 mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
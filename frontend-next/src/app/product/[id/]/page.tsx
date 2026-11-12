import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { productApi } from '@/lib/api-endpoints';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Spinner } from '@/components/ui/Loading';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await productApi.getProductById(id);
    return {
      title: product.title,
      description: product.description.slice(0, 160),
      openGraph: {
        title: product.title,
        description: product.description.slice(0, 160),
        images: product.images,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  try {
    const product = await productApi.getProductById(id);
    return (
      <>
        <Header />
        <main>
          <ProductDetail product={product} />
        </main>
        <Footer />
      </>
    );
  } catch {
    notFound();
  }
}
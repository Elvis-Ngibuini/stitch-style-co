import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/context/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Stitch & Style Co',
    template: '%s | Stitch & Style Co',
  },
  description: 'Premium clothing store - Quality fashion for men, women, and kids',
  keywords: ['clothing', 'fashion', 'e-commerce', 'men', 'women', 'kids', 'premium'],
  authors: [{ name: 'Stitch & Style Co' }],
  creator: 'Stitch & Style Co',
  publisher: 'Stitch & Style Co',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stitchandstyle.co',
    siteName: 'Stitch & Style Co',
    title: 'Stitch & Style Co - Premium Clothing',
    description: 'Quality fashion for men, women, and kids',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Stitch & Style Co',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stitch & Style Co',
    description: 'Quality fashion for men, women, and kids',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
import type { Metadata, Viewport } from 'next';
import { Inter, Libre_Baskerville, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/AppLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Primary sans-serif font - Inter (excellent readability)
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

// Reading serif font - Libre Baskerville (optimized for long-form reading)
const libreBaskerville = Libre_Baskerville({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-libre-baskerville',
  display: 'swap',
});

// Alternative sans-serif - Source Sans 3 (fallback)
const sourceSans = Source_Sans_3({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-source-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Legato - Where Stories Become IP',
  description: 'Mobile-first platform for serialized storytelling with IP protection and global reach',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Legato',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#e6a23c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${libreBaskerville.variable} ${sourceSans.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
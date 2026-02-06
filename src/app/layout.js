import './globals.css';
import Sidebar from '@/components/Layout/Sidebar';
import QuickActionWrapper from '@/components/Layout/QuickActionWrapper';
import { Toaster } from 'react-hot-toast';
import { Kanit } from 'next/font/google';
import PWARegister from '@/app/pwa-register';

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['100', '200', '300', '400', '500'],
  display: 'swap',
});

export const viewport = {
  themeColor: '#0b0b0f',
};

export const metadata = {
  title: 'Ordix',
  description: 'ระบบจัดการ Order อัจฉริยะ',
  applicationName: 'Ordix',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Ordix',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/ordix-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/ordix-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/ordix-icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={kanit.className}>
        <PWARegister />
        <div className="flex min-h-screen bg-white">
          <Sidebar />
          <main className="flex-1 ml-0">
            <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-15 pb-16 lg:pt-24 lg:pb-8">
              {children}
            </div>
          </main>
          <QuickActionWrapper />
        </div>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#000',
              color: '#fff',
              border: '1px solid #e9ecef',
              fontSize: '14px',
              maxWidth: '300px',
              marginTop: '60px',
            },
          }}
        />
      </body>
    </html>
  );
}
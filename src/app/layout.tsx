import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SolarGrid — 2D/3D Tom Konstruktori va Quyosh Kalkulyatori',
  description:
    'Quyosh panellari o\'rnatuvchi ustalar va kompaniyalar uchun 2D/3D professional tom konstruktori, quyosh simulyatsiyasi va avtomatik smeta kalkulyatori.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-cream-100 text-navy-900 selection:bg-amber-200">
        {children}
      </body>
    </html>
  );
}

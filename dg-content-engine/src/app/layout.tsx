import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DG Content Engine',
  description: 'Digital Geekz — social content engine for ghostwriting clients.',
};

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-white antialiased">{children}</body>
    </html>
  );
}

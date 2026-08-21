import './globals.css';
import '@/components/studio/studio-v2.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hikvision AIGC Studio',
  description: 'Internal infinite-canvas AIGC video creation platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

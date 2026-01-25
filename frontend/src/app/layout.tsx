import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AA Voice Concierge',
  description: 'Voice-first flight assistance for American Airlines passengers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-aa-dark min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

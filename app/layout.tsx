import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Atelier — AI Skincare & Styling Concierge',
  description:
    'Smart personal styling and clinical skin analysis powered by YouCam AI, localized weather defense, and digital wardrobe synthesis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`min-h-full flex flex-col ${playfair.className}`}>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mirror Check — AI Skincare & Styling Concierge',
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

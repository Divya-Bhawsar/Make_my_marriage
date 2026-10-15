import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Make My Marriage — Digital Wedding Management',
  description: 'Collaborative wedding planning and management platform for couples and families.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}

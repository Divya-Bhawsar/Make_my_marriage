import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Make My Marriage — The Operating System for Managing an Indian Wedding',
  description:
    'The operating system for managing an Indian wedding. Collaborative planning for couples, families, and guests from Roka to Bidaai.',
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

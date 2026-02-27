import type { Metadata } from 'next';
import { Figtree, Noto_Sans } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree'
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto'
});

export const metadata: Metadata = {
  title: 'High Value Growth',
  description: 'Multi-tenant platform for sober-living house management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} ${figtree.variable} font-sans`}>{children}</body>
    </html>
  );
}

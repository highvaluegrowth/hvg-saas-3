import type { Metadata } from 'next';
import { Figtree, Noto_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { FeedbackOverlay } from '@/components/qa/FeedbackOverlay';
import { FeedbackForm } from '@/components/qa/FeedbackForm';
import { FeedbackToggle } from '@/components/qa/FeedbackToggle';
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
      <body className={`${notoSans.variable} ${figtree.variable} font-sans`}>
        {children}
        <FeedbackOverlay />
        <FeedbackForm />
        <FeedbackToggle />
        <Analytics />
      </body>
    </html>
  );
}

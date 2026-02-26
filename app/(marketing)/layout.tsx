import type { Metadata } from 'next';
import { Figtree, Noto_Sans } from 'next/font/google';

const figtree = Figtree({
    subsets: ['latin'],
    variable: '--font-figtree',
    display: 'swap',
    weight: ['300', '400', '500', '600', '700'],
});

const notoSans = Noto_Sans({
    subsets: ['latin'],
    variable: '--font-noto',
    display: 'swap',
    weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
    title: 'HVG — Sober Living Management & Recovery Platform | High Value Growth',
    description:
        'All-in-one platform for sober living operators: property management, resident LMS, AI recovery guide, and scheduling. HIPAA-aware.',
    openGraph: {
        title: 'High Value Growth — Sober Living Platform',
        description: 'Manage your sober living house and empower residents with AI-powered recovery tools.',
        type: 'website',
    },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${figtree.variable} ${notoSans.variable}`}>
            {children}
        </div>
    );
}

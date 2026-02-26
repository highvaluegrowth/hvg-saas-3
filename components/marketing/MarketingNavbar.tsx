'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function MarketingNavbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav
            className={`fixed top-4 left-4 right-4 z-50 rounded-2xl transition-all duration-300 ${scrolled
                    ? 'bg-white/90 backdrop-blur-md shadow-lg border border-white/60'
                    : 'bg-white/70 backdrop-blur-sm shadow-md border border-white/40'
                }`}
            style={{ fontFamily: 'var(--font-figtree), sans-serif' }}
        >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}>
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                    </div>
                    <span className="font-semibold text-lg" style={{ color: '#164E63' }}>High Value Growth</span>
                </Link>

                {/* Nav Links — desktop */}
                <div className="hidden md:flex items-center gap-6">
                    {[
                        { label: 'For Operators', href: '#operators' },
                        { label: 'For Residents', href: '#residents' },
                        { label: 'AI Recovery', href: '#ai-recovery' },
                        { label: 'Pricing', href: '#demo' },
                    ].map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium transition-colors duration-200 cursor-pointer"
                            style={{ color: '#164E63' }}
                            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#0891B2')}
                            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#164E63')}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* CTA */}
                <a
                    href="#demo"
                    className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-90 hover:-translate-y-px"
                    style={{ background: '#059669' }}
                >
                    Schedule a Demo
                </a>

                {/* Mobile hamburger placeholder */}
                <button className="md:hidden p-2 rounded-lg cursor-pointer" style={{ color: '#0891B2' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}

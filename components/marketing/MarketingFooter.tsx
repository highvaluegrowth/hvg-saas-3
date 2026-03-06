'use client';

import { AppStoreBadges } from './AppStoreBadges';

const footerLinks = {
    Platform: [
        { label: 'For Operators', href: '#operators' },
        { label: 'For Residents', href: '#residents' },
        { label: 'AI Recovery', href: '#ai-recovery' },
        { label: 'LMS Builder', href: '#operators' },
    ],
    Company: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#demo' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'HIPAA Notice', href: '#' },
        { label: 'Accessibility', href: '#' },
    ],
};

export function MarketingFooter() {
    return (
        <footer
            className="py-16 px-6"
            style={{
                background: '#060E1A',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'var(--font-figtree), sans-serif',
            }}
        >
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #0891B2, #059669)' }}>
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                            </div>
                            <span className="font-semibold text-lg text-white">High Value Growth</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-noto), sans-serif' }}>
                            The all-in-one platform for sober living operators and recovery residents. HIPAA-aware. Built with care.
                        </p>
                        <AppStoreBadges />
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([group, links]) => (
                        <div key={group}>
                            <h4 className="text-xs font-semibold mb-4 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{group}</h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm transition-colors duration-200 cursor-pointer"
                                            style={{ color: 'rgba(255,255,255,0.45)' }}
                                            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#67E8F9'; }}
                                            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-noto), sans-serif' }}>
                        © {new Date().getFullYear()} High Value Growth. All rights reserved.
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-noto), sans-serif' }}>
                        This platform does not provide medical advice. Not a substitute for professional treatment.
                    </p>
                </div>
            </div>
        </footer>
    );
}

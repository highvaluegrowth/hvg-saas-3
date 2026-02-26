import Link from 'next/link';

export function AppStoreBadges({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 flex-wrap ${className}`}>
            {/* Apple App Store */}
            <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer hover:opacity-80 hover:-translate-y-px"
                style={{ background: '#1C1C1E', borderColor: '#3A3A3C', color: '#fff' }}
                aria-label="Download on the App Store"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left leading-tight">
                    <div className="text-xs opacity-70">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                </div>
            </a>

            {/* Google Play */}
            <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer hover:opacity-80 hover:-translate-y-px"
                style={{ background: '#1C1C1E', borderColor: '#3A3A3C', color: '#fff' }}
                aria-label="Get it on Google Play"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76c.22.12.48.13.72.04l12.09-6.96-2.59-2.59-10.22 9.51zM.94 1.46C.36 1.78 0 2.4 0 3.09v17.82c0 .69.36 1.31.94 1.63l.1.06 9.98-9.98v-.22L1.04 1.4l-.1.06zM22.13 10.5l-2.56-1.47-2.87 2.87 2.87 2.87 2.57-1.48c.73-.42.73-1.37-.01-1.79zM3.18.24L15.27 7.2l-2.59 2.59L2.46.28c.24-.09.5-.08.72-.04z" />
                </svg>
                <div className="text-left leading-tight">
                    <div className="text-xs opacity-70">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                </div>
            </a>
        </div>
    );
}

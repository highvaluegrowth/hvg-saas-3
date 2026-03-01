import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Download the HVG App',
    description: 'Download the High Value Growth app to start your recovery journey. Available on iOS and Android.',
};

export default function DownloadPage() {
    return (
        <main className="download-page">
            <div className="download-container">
                {/* Logo / Brand */}
                <div className="download-brand">
                    <span className="download-logo">HVG</span>
                    <h1 className="download-title">High Value Growth</h1>
                    <p className="download-tagline">Your recovery journey starts here.</p>
                </div>

                {/* Store buttons */}
                <div className="download-buttons">
                    <a
                        href="https://apps.apple.com/app/hvg"
                        className="store-btn store-btn-apple"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Download on the App Store"
                    >
                        <svg viewBox="0 0 24 24" className="store-icon" aria-hidden="true" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        <div className="store-btn-text">
                            <span className="store-sub">Download on the</span>
                            <span className="store-name">App Store</span>
                        </div>
                    </a>

                    <a
                        href="https://play.google.com/store/apps/details?id=com.hvg_saas_3.mobile"
                        className="store-btn store-btn-google"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Get it on Google Play"
                    >
                        <svg viewBox="0 0 24 24" className="store-icon" aria-hidden="true" fill="currentColor">
                            <path d="M3.18 23.76c.3.17.64.24.99.2L15.43 12 11.6 8.17 3.18 23.76zM20.96 10.1l-3.2-1.83-4.05 4.05 4.05 4.05 3.22-1.84c.92-.52.92-1.91-.02-2.43zM2.01.49C1.9.67 1.84.9 1.84 1.17v21.66c0 .27.06.5.17.68l.09.08 12.14-12.14v-.28L2.1.41 2.01.49zm9.59 12.67l-1.4 1.4L3.18.25c.35-.04.7.04.99.2l7.43 12.71z" />
                        </svg>
                        <div className="store-btn-text">
                            <span className="store-sub">Get it on</span>
                            <span className="store-name">Google Play</span>
                        </div>
                    </a>
                </div>

                {/* QR hint */}
                <p className="download-hint">Open this page on your phone or scan the QR code from the app store.</p>

                {/* Back to marketing */}
                <Link href="https://highvaluegrowth.com" className="download-back">
                    Learn more at highvaluegrowth.com →
                </Link>
            </div>

            <style>{`
        :global(body) { margin: 0; background: #0f172a; }

        .download-page {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .download-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .download-brand { display: flex; flex-direction: column; align-items: center; gap: 8px; }

        .download-logo {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 800; color: #fff;
          letter-spacing: -1px;
          display: grid; place-items: center;
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
        }

        .download-title {
          font-size: 28px; font-weight: 700;
          color: #f8fafc; margin: 0;
          letter-spacing: -0.5px;
        }

        .download-tagline { font-size: 16px; color: #94a3b8; margin: 0; }

        .download-buttons { display: flex; flex-direction: column; gap: 14px; width: 100%; }

        .store-btn {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px; border-radius: 14px;
          text-decoration: none; transition: transform 0.15s, box-shadow 0.15s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .store-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.3); }

        .store-btn-apple { background: #000; color: #fff; }
        .store-btn-google { background: #fff; color: #1a1a1a; }

        .store-icon { width: 28px; height: 28px; flex-shrink: 0; }

        .store-btn-text { display: flex; flex-direction: column; align-items: flex-start; }
        .store-sub { font-size: 11px; opacity: 0.7; line-height: 1; }
        .store-name { font-size: 18px; font-weight: 700; line-height: 1.3; }

        .download-hint { font-size: 13px; color: #475569; margin: 0; }

        .download-back {
          font-size: 14px; color: #6366f1;
          text-decoration: none; border-bottom: 1px solid transparent;
          transition: border-color 0.15s;
        }
        .download-back:hover { border-color: #6366f1; }
      `}</style>
        </main>
    );
}

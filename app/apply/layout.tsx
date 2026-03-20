import type { ReactNode } from 'react';

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#060E1A' }}
    >
      {/* Minimal branded header */}
      <header
        className="h-14 flex items-center px-6 shrink-0"
        style={{
          background: 'rgba(6,14,26,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0891B2, #0e7490)' }}
          >
            <span className="text-white font-black text-xs">HVG</span>
          </div>
          <span className="text-sm font-black text-white tracking-tight">High Value Growth</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}

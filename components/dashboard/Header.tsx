'use client';

import { useAISidebarStore } from '@/lib/stores/aiSidebarStore';

interface HeaderProps {
  tenantName?: string;
  onMenuClick?: () => void;
}

export function Header({ tenantName, onMenuClick }: HeaderProps) {
  const { isOpen, setOpen } = useAISidebarStore();

  return (
    <header
      style={{
        background: 'rgba(6,14,26,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
      className="h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10"
    >
      {/* Left — Mobile menu + Tenant name */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          style={{ color: 'rgba(255,255,255,0.5)' }}
          className="lg:hidden hover:text-white focus:outline-none transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {tenantName && (
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {tenantName}
            </h1>
          </div>
        )}
      </div>

      {/* Right — icon group + user */}
      <div className="flex items-center space-x-1">

        {/* AI Sidebar Toggle */}
        <button
          onClick={() => setOpen(!isOpen)}
          data-ai-toggle
          title="Toggle AI Assistant"
          style={{ color: isOpen ? '#67E8F9' : 'rgba(255,255,255,0.45)' }}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
        </button>

        {/* Notifications */}
        <button
          style={{ color: 'rgba(255,255,255,0.45)' }}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:text-white transition-colors relative"
          title="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Divider */}
        <span
          className="hidden md:block h-5 mx-1"
          style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}
        />

      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/lib/stores/useChatStore';

interface MobileBottomNavProps {
  tenantId: string;
}

export function MobileBottomNav({ tenantId }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { openDrawer, setActiveConversation, setVoiceMode } = useChatStore();

  const handleOutletPress = () => {
    setVoiceMode(false);
    setActiveConversation('__new_outlet__');
    openDrawer();
  };

  const isActive = (href: string) =>
    href === `/${tenantId}/portal`
      ? pathname === `/${tenantId}/portal`
      : pathname.startsWith(href);

  const linkItems = [
    {
      label: 'Home',
      href: `/${tenantId}/portal`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      label: 'Chores',
      href: `/${tenantId}/portal/chores`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
      ),
    },
    {
      label: 'Profile',
      href: `/${tenantId}/portal/profile`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed bottom-0 w-full max-w-md z-40"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(6, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-around py-2 px-2">
        {/* Home */}
        <Link
          href={linkItems[0].href}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
          style={{ color: isActive(linkItems[0].href) ? '#67E8F9' : 'rgba(255,255,255,0.4)' }}
        >
          {linkItems[0].icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{linkItems[0].label}</span>
        </Link>

        {/* Chores */}
        <Link
          href={linkItems[1].href}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
          style={{ color: isActive(linkItems[1].href) ? '#67E8F9' : 'rgba(255,255,255,0.4)' }}
        >
          {linkItems[1].icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{linkItems[1].label}</span>
        </Link>

        {/* Outlet AI — primary action button */}
        <button
          onClick={handleOutletPress}
          aria-label="Open HVG Outlet AI"
          className="relative flex flex-col items-center gap-1 -mt-5"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #0891B2, #0e7490)',
              boxShadow: '0 0 20px rgba(8,145,178,0.45), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#67E8F9' }}>Outlet</span>
        </button>

        {/* Profile */}
        <Link
          href={linkItems[2].href}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
          style={{ color: isActive(linkItems[2].href) ? '#67E8F9' : 'rgba(255,255,255,0.4)' }}
        >
          {linkItems[2].icon}
          <span className="text-[9px] font-black uppercase tracking-widest">{linkItems[2].label}</span>
        </Link>
      </div>

      {/* iOS safe-area bottom padding */}
      <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}

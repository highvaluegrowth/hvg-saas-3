'use client';

import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/stores/useChatStore';
import { subscribeToUserConversations } from '../services/chatService';
import { DrawerRouter } from './DrawerRouter';
import type { Conversation } from '../schemas/chat.schemas';

const DRAWER_WIDTH = 380;

interface GlobalDrawerContainerProps {
  currentUserId: string;
}

export function GlobalDrawerContainer({ currentUserId }: GlobalDrawerContainerProps) {
  const { isOpen, closeDrawer } = useChatStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time conversation list for this user
  useEffect(() => {
    if (!currentUserId) return;

    setLoading(true);
    const unsub = subscribeToUserConversations(
      currentUserId,
      (data) => {
        setConversations(data);
        setLoading(false);
      },
      (err) => {
        console.error('Conversation stream error:', err);
        setLoading(false);
      }
    );
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [currentUserId]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    },
    [isOpen, closeDrawer]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: `${DRAWER_WIDTH}px`,
          transform: isOpen ? 'translateX(0)' : `translateX(${DRAWER_WIDTH}px)`,
          background: 'rgba(6, 14, 26, 0.97)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Close button */}
        <button
          onClick={closeDrawer}
          className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white z-10"
          aria-label="Close communications drawer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex-1 overflow-hidden mt-0">
          <DrawerRouter
            conversations={conversations}
            conversationsLoading={loading}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </>
  );
}

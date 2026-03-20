'use client';

import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@/lib/stores/useChatStore';
import { useLayoutStore } from '@/lib/stores/useLayoutStore';
import { subscribeToUserConversations } from '../services/chatService';
import { DrawerRouter } from './DrawerRouter';
import type { Conversation } from '../schemas/chat.schemas';

interface GlobalDrawerContainerProps {
  currentUserId: string;
}

export function GlobalDrawerContainer({ currentUserId }: GlobalDrawerContainerProps) {
  const { isOpen, closeDrawer } = useChatStore();
  const { drawerWidth, setDrawerWidth } = useLayoutStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = drawerWidth;

      const onMouseMove = (ev: MouseEvent) => {
        setDrawerWidth(startWidth + startX - ev.clientX);
      };
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [drawerWidth, setDrawerWidth]
  );

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
          width: `${drawerWidth}px`,
          transform: isOpen ? 'translateX(0)' : `translateX(${drawerWidth}px)`,
          background: 'rgba(6, 14, 26, 0.97)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Drag handle — left edge */}
        <div
          onMouseDown={handleDragStart}
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-cyan-500/30 transition-colors z-20"
          title="Drag to resize"
        />

        {/* Content — close button lives inside each view's header */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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

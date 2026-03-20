'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/stores/useChatStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { subscribeToMessages, sendMessage } from '../services/chatService';
import { MessageInput } from './MessageInput';
import { OutletVoice } from '@/components/ai-sidebar/OutletVoice';
import type { ConversationType, Message } from '../schemas/chat.schemas';

interface ActiveThreadProps {
  conversationId: string;
  title?: string | null;
  conversationType: ConversationType;
  currentUserId: string;
}

export function ActiveThread({ conversationId, title, conversationType, currentUserId }: ActiveThreadProps) {
  const { setActiveConversation, isVoiceMode, setVoiceMode, closeDrawer } = useChatStore();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAiChat = conversationType === 'ai_chat';
  const isDirector = user?.role === 'super_admin';

  const handleVoiceSend = async (text: string) => {
    if (!text.trim()) return;
    try {
      await sendMessage(conversationId, currentUserId, text);
      const token = await authService.getIdToken();
      const res = await fetch('/api/ai/outlet/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply: string = data.reply ?? '';
        if (reply) {
          await sendMessage(conversationId, 'system_ai', reply);
          if (typeof window !== 'undefined') {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
          }
        }
      }
    } catch (err) {
      console.error('Voice send error:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMessages(
      conversationId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error('Message stream error:', err);
        setLoading(false);
      }
    );
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <div className="flex flex-col h-full">
      {/* Voice Mode Overlay */}
      {isAiChat && isVoiceMode && (
        <OutletVoice
          onSpeechProcessed={handleVoiceSend}
          isDirector={isDirector}
          onClose={() => setVoiceMode(false)}
        />
      )}

      {/* Header — Left: Back | Center: Title | Right: Voice + Close */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/8 shrink-0">
        {/* Left: Back */}
        <button
          onClick={() => { setVoiceMode(false); setActiveConversation(null); }}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white shrink-0"
          aria-label="Back to list"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Center: Title */}
        <h3 className="text-sm font-bold text-white truncate flex-1 min-w-0">{title ?? 'Conversation'}</h3>

        {/* Right: Voice toggle (ai_chat only) + Close drawer */}
        <div className="flex items-center gap-1 shrink-0">
          {isAiChat && (
            <button
              onClick={() => setVoiceMode(!isVoiceMode)}
              title={isVoiceMode ? 'Switch to text' : 'Switch to voice'}
              className={`p-2 rounded-lg transition-colors ${
                isVoiceMode
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                  : 'hover:bg-white/10 text-slate-400 hover:text-violet-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </button>
          )}
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            aria-label="Close drawer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <span className="text-2xl">👋</span>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Start the conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isOwn
                      ? 'bg-cyan-600 text-white rounded-tr-sm'
                      : 'bg-white/10 text-white rounded-tl-sm'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className="text-[9px] opacity-50 block mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        currentUserId={currentUserId}
        conversationType={conversationType}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import { sendMessage } from '../services/chatService';
import type { ConversationType } from '../schemas/chat.schemas';

interface MessageInputProps {
  conversationId: string;
  currentUserId: string;
  conversationType: ConversationType;
}

export function MessageInput({ conversationId, currentUserId, conversationType }: MessageInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const isAi = conversationType === 'ai_chat';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      // Save user message first
      await sendMessage(conversationId, currentUserId, trimmed);

      if (isAi) {
        // Pipe to HVG Partner AI route, then persist the response
        const token = await authService.getIdToken();
        const res = await fetch('/api/ai/outlet/operator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: trimmed }),
        });
        if (res.ok) {
          const data = await res.json();
          const aiReply: string = data.reply ?? '';
          if (aiReply) {
            await sendMessage(conversationId, 'system_ai', aiReply);
          }
        }
      }
    } catch (err) {
      console.error('Send error:', err);
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="shrink-0 px-4 py-3 border-t border-white/8">
      <div className="flex items-center gap-2">
        {isAi && (
          <span className="text-[9px] font-black text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg px-2 py-1.5 shrink-0 uppercase tracking-widest">
            AI
          </span>
        )}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAi ? 'Ask HVG Partner…' : 'Type a message…'}
          disabled={sending}
          className="flex-1 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-cyan-500 transition-all shrink-0"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}

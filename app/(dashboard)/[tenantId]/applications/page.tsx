'use client';

import { use, useEffect, useState, useCallback, useMemo } from 'react';
import { authService } from '@/features/auth/services/authService';
import type { Application, ApplicationStatus, ApplicationType } from '@/features/applications/types';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Tenant Chat Component ───────────────────────────────────────────────────

function TenantChat({ tenantId, applicationId, applicantName }: { tenantId: string; applicationId: string; applicantName: string }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function initChat() {
      try {
        const token = await authService.getIdToken();
        const res = await fetch(`/api/tenants/${tenantId}/applications/${applicationId}/chat`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.chatId) {
          setChatId(data.chatId);
          fetchMessages(data.chatId);
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        setLoading(false);
      }
    }
    initChat();
  }, [tenantId, applicationId]);

  async function fetchMessages(id: string) {
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/mobile/inbox/chats/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || sending) return;
    setSending(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/mobile/inbox/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage.trim(), type: 'text' })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(chatId);
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            <p className="text-xs text-slate-500 italic">No messages yet. Send a message to start the conversation with {applicantName.split(' ')[0]}.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.senderName === 'User' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.senderName === 'User' ? 'bg-white/10 text-white rounded-tl-none' : 'bg-cyan-600 text-white rounded-tr-none'}`}>
                <p>{msg.content}</p>
                <span className="text-[9px] opacity-50 block mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white disabled:opacity-50 transition-all hover:bg-cyan-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: 'assigned', label: 'New', color: '#93C5FD' },
  { id: 'reviewing', label: 'Reviewing', color: '#67E8F9' },
  { id: 'waitlisted', label: 'Waitlisted', color: '#C4B5FD' },
  { id: 'accepted', label: 'Admitted', color: '#6EE7B7' },
];

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; badge: React.CSSProperties }> = {
  draft: {
    label: 'Draft',
    badge: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }
  },
  pending: {
    label: 'Submitted',
    badge: { background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }
  },
  pending_triage: {
    label: 'Global Review',
    badge: { background: 'rgba(6,182,212,0.1)', color: '#67E8F9', border: '1px solid rgba(6,182,212,0.2)' }
  },
  assigned_to_tenant: {
    label: 'Assigned',
    badge: { background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }
  },
  assigned: {
    label: 'New',
    badge: { background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }
  },
  reviewing: {
    label: 'Reviewing',
    badge: { background: 'rgba(6,182,212,0.1)', color: '#67E8F9', border: '1px solid rgba(6,182,212,0.2)' }
  },
  accepted: {
    label: 'Admitted',
    badge: { background: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
  },
  waitlisted: {
    label: 'Waitlisted',
    badge: { background: 'rgba(139,92,246,0.1)', color: '#C4B5FD', border: '1px solid rgba(139,92,246,0.2)' }
  },
  rejected: {
    label: 'Rejected',
    badge: { background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }
  },
  archived: {
    label: 'Archived',
    badge: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }
  }
};

const TYPE_CONFIG: Record<ApplicationType, { label: string; icon: string }> = {
  bed: { label: 'Bed', icon: '🛏' },
  staff: { label: 'Staff', icon: '👤' },
  course: { label: 'Course', icon: '📚' },
  event: { label: 'Event', icon: '📅' },
  tenant: { label: 'Tenant', icon: '🏠' },
};

// ─── Kanban Card Component ───────────────────────────────────────────────────

function KanbanCard({ app, isOverlay = false, onClick }: { app: Application; isOverlay?: boolean; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: app.id,
    disabled: isOverlay,
    data: {
      type: 'Application',
      app,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const typeCfg = TYPE_CONFIG[app.type] || { label: app.type, icon: '📄' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging && onClick) onClick();
      }}
      className={`group bg-[#161B22] border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all ${isOverlay ? 'shadow-2xl ring-2 ring-cyan-500/50' : ''
        }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>{typeCfg.icon}</span>
          {typeCfg.label}
        </span>
        {app.status === 'waitlisted' && (
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
            Waitlisted
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
        {app.applicantName}
      </h4>
      <p className="text-xs text-slate-500 mt-1 truncate">{app.applicantEmail}</p>

      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-3">
        <span>📍 {app.zipCode}</span>
        <span>{new Date(app.submittedAt as string).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ─── Kanban Column Component ─────────────────────────────────────────────────

function KanbanColumn({ id, label, color, applications, onCardClick }: { id: string; label: string; color: string; applications: Application[]; onCardClick: (app: Application) => void }) {
  const { setNodeRef } = useSortable({
    id,
    data: {
      type: 'Column',
    },
  });

  return (
    <div className="flex flex-col w-72 bg-black/20 rounded-2xl border border-white/5 h-full max-h-[calc(100vh-250px)]">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">{label}</h3>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
        <SortableContext items={applications.map(a => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map(app => (
            <KanbanCard key={app.id} app={app} onClick={() => onCardClick(app)} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center">
            <p className="text-[10px] text-slate-600 font-medium uppercase tracking-tighter italic">Drop Here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function ApplicationsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setApplications(json.applications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateAppStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      const token = await authService.getIdToken();
      await fetch(`/api/tenants/${tenantId}/applications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId: appId, status: newStatus }),
      });
      // Optimistic update already handled by dnd logic if we want,
      // but simpler to just refresh after drop for now to ensure consistency
      await fetchApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchApplications(); // Revert
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Application') {
      setActiveApp(event.active.data.current.app);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);

    if (!over) return;

    const appId = active.id as string;
    const overId = over.id as string;

    // Check if we dropped onto a column
    const overColumn = COLUMNS.find(c => c.id === overId);
    if (overColumn) {
      const app = applications.find(a => a.id === appId);
      if (app && app.status !== overColumn.id) {
        updateAppStatus(appId, overColumn.id);
      }
      return;
    }

    // Check if we dropped onto another card
    const overApp = applications.find(a => a.id === overId);
    if (overApp) {
      const activeApp = applications.find(a => a.id === appId);
      if (activeApp && activeApp.status !== overApp.status) {
        updateAppStatus(appId, overApp.status);
      }
    }
  };

  const applicationsByStatus = useMemo(() => {
    const groups: Record<ApplicationStatus, Application[]> = {
      draft: [], pending: [], pending_triage: [], assigned_to_tenant: [],
      assigned: [], reviewing: [], accepted: [], waitlisted: [], rejected: [], archived: []
    };
    applications.forEach(app => {
      if (groups[app.status]) groups[app.status].push(app);
    });
    return groups;
  }, [applications]);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">APPLICATION PIPELINE</h1>
        <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
          Manage resident admission and staff onboarding
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-10 custom-scrollbar min-h-[600px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                applications={applicationsByStatus[col.id]}
                onCardClick={setSelectedApp}
              />
            ))}

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeApp ? (
                <div className="w-72">
                  <KanbanCard app={activeApp} isOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[80vh] transform overflow-hidden rounded-3xl bg-[#0D1117] border border-white/10 flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{selectedApp.applicantName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[selectedApp.status].badge.color === '#6EE7B7' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{selectedApp.applicantEmail} • {selectedApp.zipCode}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Details */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-white/10">
                <h3 className="text-xs font-bold text-[#D946EF] uppercase tracking-widest mb-6">Application Details</h3>
                <div className="space-y-6">
                  {Object.entries(selectedApp.data || {}).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-[10px] uppercase tracking-tighter text-slate-500 font-bold mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <p className="text-sm text-slate-200">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Chat Interface Placeholder */}
              <div className="w-[400px] bg-black/20 flex flex-col">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Direct Message</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-10 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                      <span className="text-2xl">💬</span>
                    </div>
                    <p className="text-sm text-slate-400">Secure messaging with {selectedApp.applicantName.split(' ')[0]} will be available here.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

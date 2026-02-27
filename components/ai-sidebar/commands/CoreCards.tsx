'use client';

// Generic types based on what the API tools return
type EventData = { id: string; title: string; scheduledAt: string; location?: string };
type ChoreData = { id: string; title: string; priority: string; status: string; dueDate?: string };
type RideData = { id: string; destination: string; status: string; scheduledAt?: string };

// ─── Events Card ──────────────────────────────────────────────────────────
export function EventsMiniCard({ events }: { events: EventData[] }) {
    if (!events || events.length === 0) return <NoData message="No upcoming events." />;
    return (
        <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-emerald-200/50 shadow-sm w-full">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                Upcoming Events
            </div>
            {events.slice(0, 3).map(e => {
                const date = e.scheduledAt ? new Date(e.scheduledAt) : null;
                return (
                    <div key={e.id} className="flex justify-between items-center text-sm border-b border-stone-100 last:border-0 pb-1.5 last:pb-0">
                        <span className="font-medium text-stone-800 truncate pr-2">{e.title}</span>
                        <span className="text-xs text-stone-500 whitespace-nowrap">
                            {date ? date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                        </span>
                    </div>
                );
            })}
            {events.length > 3 && <p className="text-xs text-stone-400 mt-1 text-center">+ {events.length - 3} more</p>}
        </div>
    );
}

// ─── Chores Card ──────────────────────────────────────────────────────────
export function ChoresMiniCard({ chores }: { chores: ChoreData[] }) {
    if (!chores || chores.length === 0) return <NoData message="You're all caught up on chores!" />;
    return (
        <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-sage-200/50 shadow-sm w-full" style={{ borderColor: 'rgba(113,131,85,0.2)' }}>
            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-1" style={{ color: '#718355' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
                Assigned Chores
            </div>
            {chores.map(c => (
                <label key={c.id} className="flex flex-start gap-2 text-sm items-start cursor-pointer hover:bg-stone-50 p-1 -mx-1 rounded">
                    <input type="checkbox" className="mt-1 rounded text-emerald-500 focus:ring-emerald-500 border-stone-300 w-3.5 h-3.5" />
                    <span className="font-medium text-stone-800 pt-0.5">{c.title}</span>
                    {c.priority === 'high' && <span className="ml-auto mt-0.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">HIGH</span>}
                </label>
            ))}
        </div>
    );
}

// ─── Sobriety Card ────────────────────────────────────────────────────────
export function SobrietyStreakCard({ days, years, months }: { days: number; years: number; months: number }) {
    if (days === undefined) return null;

    return (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md text-white w-full">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                </svg>
            </div>
            <div>
                <p className="text-sm font-medium opacity-90 leading-tight">Current Streak</p>
                <div className="text-2xl font-bold leading-none mt-1">{days} <span className="text-lg font-medium opacity-80">days</span></div>
                {years > 0 && <p className="text-xs opacity-80 mt-1">{years} {years === 1 ? 'Year' : 'Years'}, {months} {months === 1 ? 'Month' : 'Months'}</p>}
            </div>
        </div>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────
function NoData({ message }: { message: string }) {
    return (
        <div className="text-xs text-stone-500 italic p-2 bg-stone-50 rounded-lg text-center border border-stone-100">
            {message}
        </div>
    );
}

'use client';

import { EventsMiniCard, ChoresMiniCard, SobrietyStreakCard } from './CoreCards';

interface CommandCardProps {
    type: string;
    data: unknown;
}

export function CommandCard({ type, data }: CommandCardProps) {
    // Safe cast for rendering based on the tool that was called
    const d = (data as Record<string, unknown>)?.response as Record<string, unknown> ?? data;

    switch (type) {
        case 'get_upcoming_events':
            return <EventsMiniCard events={(d.events as any[]) ?? []} />;

        case 'create_event':
            return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5M12 10.5h.008v.008H12v-.008Zm0 3h.008v.008H12v-.008Zm0 3h.008v.008H12v-.008Zm-3-6h.008v.008H9v-.008Zm0 3h.008v.008H9v-.008Zm0 3h.008v.008H9v-.008Zm6-6h.008v.008H15v-.008Zm0 3h.008v.008H15v-.008Zm0 3h.008v.008H15v-.008Z" />
                    </svg>
                    Event created successfully: {d.title as string}
                </div>
            );

        case 'get_chore_status':
        case 'get_pending_chores':
            return <ChoresMiniCard chores={(d.chores as any[]) ?? []} />;

        case 'assign_chore':
            return (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {d.message as string ?? 'Chore assigned successfully.'}
                </div>
            );

        case 'get_sobriety_stats':
            return <SobrietyStreakCard days={d.daysSober as number} years={d.years as number} months={d.months as number} />;

        case 'log_mood':
            return (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {d.message as string ?? 'Mood logged successfully.'}
                </div>
            );

        case 'get_ride_requests':
            return (
                <div className="rounded-xl p-3 text-sm w-full bg-stone-50 border border-stone-200 text-stone-700">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        Pending Ride Requests ({(d.requests as any[])?.length || 0})
                    </div>
                    {!(d.requests as any[])?.length ? (
                        <p className="text-xs text-stone-500">No pending rides.</p>
                    ) : (
                        <ul className="space-y-2">
                            {((d.requests as any[]) ?? []).map((req, i) => (
                                <li key={i} className="bg-white border text-xs border-stone-100 p-2 rounded-lg flex justify-between items-center">
                                    <span>{req.residentName} → {req.destination}</span>
                                    <span className="font-medium text-emerald-600">{new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );

        case 'get_join_requests':
            return (
                <div className="rounded-xl p-3 text-sm w-full bg-stone-50 border border-stone-200 text-stone-700">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                        Pending Join Requests ({(d.requests as any[])?.length || 0})
                    </div>
                    {!(d.requests as any[])?.length ? (
                        <p className="text-xs text-stone-500">No pending join requests.</p>
                    ) : (
                        <ul className="space-y-2">
                            {((d.requests as any[]) ?? []).map((req, i) => (
                                <li key={i} className="bg-white border text-xs border-stone-100 p-2 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between font-medium">
                                        <span>{req.name}</span>
                                        <span className="text-emerald-600 capitalize">{req.status}</span>
                                    </div>
                                    <span className="text-stone-500 leading-tight">{req.email}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );

        default:
            // Fallback for unknown/new tools
            return (
                <div className="rounded-xl p-3 text-xs w-full bg-stone-50 border border-stone-200 text-stone-700">
                    <div className="font-semibold mb-1 uppercase tracking-wide opacity-70 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                        System Action: {type.replace(/_/g, ' ')}
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(d, null, 2)}</pre>
                </div>
            );
    }
}

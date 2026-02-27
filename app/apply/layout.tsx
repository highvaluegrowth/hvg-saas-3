import { ReactNode } from 'react';

export default function ApplyLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">High Value Growth</h1>
            </header>
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}

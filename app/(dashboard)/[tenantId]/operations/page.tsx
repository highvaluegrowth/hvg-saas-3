'use client';

import { use } from 'react';
import { OperationsBoard } from '@/features/kanban/components/OperationsBoard';

interface OperationsPageProps {
  params: Promise<{ tenantId: string }>;
}

export default function OperationsPage({ params }: OperationsPageProps) {
  const { tenantId } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter">OPERATIONS CONTROL</h1>
        <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
          Unified view of applications, chores, and tasks
        </p>
      </div>

      <OperationsBoard tenantId={tenantId} />
    </div>
  );
}

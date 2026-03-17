'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { authService } from '@/features/auth/services/authService';
import { Search, UserCheck, AlertCircle } from 'lucide-react';

interface NewResidentPageProps {
  params: Promise<{ tenantId: string }>;
}

export default function NewResidentPage({ params }: NewResidentPageProps) {
  const { tenantId } = use(params);
  const router = useRouter();
  
  const [lookupQuery, setLookupQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    
    setSearching(true);
    setError(null);
    setFoundUser(null);
    
    try {
      const token = await authService.getIdToken();
      const res = await fetch(`/api/tenants/${tenantId}/residents/lookup?query=${encodeURIComponent(lookupQuery.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'User not found');
      }
      
      setFoundUser(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'User not found');
    } finally {
      setSearching(false);
    }
  }

  async function handleEnroll() {
    if (!foundUser) return;
    setEnrolling(true);
    setError(null);
    
    try {
      const token = await authService.getIdToken();
      // Using a new endpoint specifically for enrolling existing users
      const res = await fetch(`/api/tenants/${tenantId}/residents/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: foundUser.uid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }

      router.push(`/${tenantId}/residents/${foundUser.uid}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to enroll resident');
      setEnrolling(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Enroll Resident</h1>
        <p className="text-white/50 mt-1 text-sm">
          Search for an existing global user by Email or HVG ID to instantly enroll them.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <p className="text-sm text-rose-400 font-medium">{error}</p>
        </div>
      )}

      <Card className="bg-white/5 border border-white/10 shadow-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-base text-white uppercase tracking-widest">Global User Lookup</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <form onSubmit={handleLookup} className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/40" />
              </div>
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Enter Email Address or HVG ID..."
                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/50 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
              />
            </div>
            <Button 
              type="submit" 
              disabled={searching || !lookupQuery.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl shadow-lg shadow-cyan-600/20 transition-all"
            >
              {searching ? 'Searching...' : 'Find User'}
            </Button>
          </form>

          {foundUser && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <UserCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{foundUser.displayName || 'Unnamed User'}</h3>
                    <p className="text-sm text-emerald-400/80 font-medium">{foundUser.email}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-1 uppercase tracking-wider">ID: {foundUser.uid}</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                >
                  {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => router.back()} className="border-white/10 text-white/70 hover:bg-white/10 bg-transparent">
          Cancel
        </Button>
      </div>
    </div>
  );
}


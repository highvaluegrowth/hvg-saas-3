'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';

interface ProfileForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

const EMPTY_FORM: ProfileForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
        {label}
        {required && <span style={{ color: '#67E8F9' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all';
const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
};

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for Firebase Auth state — redirect to register if not signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUid(firebaseUser.uid);
      } else {
        router.push('/apply/register');
      }
      setAuthLoading(false);
    });
    return unsub;
  }, [router]);

  const set = (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setError(null);
    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', uid), {
        uid,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        phone: form.phone.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        emergencyContactRelationship: form.emergencyContactRelationship.trim() || null,
        createdAt: now,
        updatedAt: now,
      });
      // Phase 9.3 will build the wizard — redirect to apply hub for now
      router.push('/apply');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Header */}
        <div className="mb-7">
          <p
            className="text-xs font-black uppercase tracking-widest mb-1"
            style={{ color: 'rgba(103,232,249,0.7)' }}
          >
            Step 1 of 2
          </p>
          <h1 className="text-2xl font-black text-white">Your Basic Information</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            This is kept private and used only for your application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <input
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                required
                placeholder="Jane"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Last Name" required>
              <input
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                required
                placeholder="Smith"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* DOB */}
          <Field label="Date of Birth" required>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={set('dateOfBirth')}
              required
              max={new Date().toISOString().split('T')[0]}
              className={inputClass}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </Field>

          {/* Phone */}
          <Field label="Phone Number" required>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              required
              placeholder="(555) 555-5555"
              className={inputClass}
              style={inputStyle}
            />
          </Field>

          {/* Divider */}
          <div className="pt-2">
            <p
              className="text-xs font-black uppercase tracking-widest mb-4"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Emergency Contact
            </p>
            <div className="space-y-4">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={set('emergencyContactName')}
                  required
                  placeholder="Contact name"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Phone Number" required>
                <input
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={set('emergencyContactPhone')}
                  required
                  placeholder="(555) 555-5555"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Relationship">
                <select
                  value={form.emergencyContactRelationship}
                  onChange={set('emergencyContactRelationship')}
                  className={inputClass}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                >
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse / Partner">Spouse / Partner</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white',
              boxShadow: '0 0 20px rgba(16,185,129,0.25)',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              'Save & Continue →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

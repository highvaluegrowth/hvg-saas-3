import { useState } from 'react';
import type { Href } from 'expo-router';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Switch, Pressable,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { userApi } from '@/lib/api/routes';
import { API_BASE_URL } from '@/lib/config';
import { useTabBarHeight } from '@/lib/constants/layout';
import { safeFormat } from '@/lib/utils/date';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

// ─── Recovery Goal Tag Options ────────────────────────────────────────────────

const GOAL_TAGS = [
  'Employment', 'Family Reconnection', 'Mental Health',
  'Housing Stability', 'Education', 'Spirituality', 'Fitness',
  'Social Skills', 'Financial Literacy', 'Sobriety Maintenance',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { appUser, signOut, refreshAppUser, firebaseUser } = useAuth();
  const tabBarHeight = useTabBarHeight();
  const [editing, setEditing] = useState(false);

  const [displayName, setDisplayName] = useState(appUser?.displayName ?? '');
  const [sobrietyDateStr, setSobrietyDateStr] = useState(
    appUser?.sobrietyDate
      ? safeFormat(appUser.sobrietyDate as unknown as string, 'yyyy-MM-dd')
      : ''
  );
  const [goals, setGoals] = useState<string[]>(appUser?.recoveryGoals ?? []);
  const [allergies, setAllergies] = useState('');
  const [triggers, setTriggers] = useState('');
  const [notifEvents, setNotifEvents] = useState(appUser?.notificationPreferences?.events ?? true);
  const [notifChores, setNotifChores] = useState(appUser?.notificationPreferences?.chores ?? true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // ── Toggle goal chip ────────────────────────────────────────────────────────
  function toggleGoal(goal: string) {
    if (!editing) return;
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  // ── Save profile ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        displayName,
        sobrietyDate: sobrietyDateStr
          ? (new Date(sobrietyDateStr) as unknown as Date) : undefined,
        recoveryGoals: goals,
        notificationPreferences: {
          events: notifEvents, chores: notifChores,
          rides: true, messages: true,
        },
      } as Parameters<typeof userApi.updateMe>[0]),
    onSuccess: async () => {
      await refreshAppUser();
      setEditing(false);
      Alert.alert('Saved', 'Profile updated.');
    },
    onError: (e: unknown) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
    },
  });

  // ── Sobriety stats ──────────────────────────────────────────────────────────
  const sobrietyDate = appUser?.sobrietyDate
    ? new Date(appUser.sobrietyDate as unknown as string) : null;
  const now = new Date();
  const daysSober = sobrietyDate ? differenceInDays(now, sobrietyDate) : null;
  const years = sobrietyDate ? differenceInYears(now, sobrietyDate) : null;
  const months = sobrietyDate ? differenceInMonths(now, sobrietyDate) % 12 : null;

  // ── Sign out ────────────────────────────────────────────────────────────────
  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/'); },
      },
    ]);
  }

  // ── Save API key ────────────────────────────────────────────────────────────
  async function handleSaveApiKey() {
    if (!apiKey.trim()) return;
    const tenantId = appUser?.tenantIds?.[0];
    if (!tenantId) {
      Alert.alert('No organization', 'Complete onboarding to save an API key.');
      return;
    }
    setApiKeySaving(true);
    try {
      const token = await firebaseUser?.getIdToken(true);
      if (!token) throw new Error('Not authenticated');
      await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/settings`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiApiKey: apiKey.trim() }),
      });
      setApiKeySaved(true);
      setApiKey('');
      Alert.alert('Saved', 'API key saved.');
    } catch {
      Alert.alert('Error', 'Failed to save API key.');
    } finally { setApiKeySaving(false); }
  }

  const initials = (appUser?.displayName ?? '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Header ── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{appUser?.displayName ?? 'Your Profile'}</Text>
        <Text style={styles.profileEmail}>{appUser?.email ?? ''}</Text>
        {appUser?.tenantIds?.[0] && (
          <View style={styles.enrolledBadge}>
            <Text style={styles.enrolledBadgeText}>✓ Enrolled in house</Text>
          </View>
        )}
      </View>

      {/* ── Sobriety Tracker ── */}
      <View style={styles.sobrietyCard}>
        <Text style={styles.sobrietyLabel}>Sobriety Tracker 🏆</Text>
        {daysSober !== null ? (
          <>
            <Text style={styles.sobrietyDays}>{daysSober}</Text>
            <Text style={styles.sobrietyUnit}>days sober</Text>
            {(years ?? 0) > 0 && (
              <Text style={styles.sobrietyBreakdown}>{years}y {months}m</Text>
            )}
            <Text style={styles.sobrietySince}>
              Since {sobrietyDate ? safeFormat(sobrietyDate, 'MMMM d, yyyy') : ''}
            </Text>
          </>
        ) : (
          <Text style={styles.sobrietyEmpty}>Set your sobriety date below to start tracking</Text>
        )}
      </View>

      {/* ── Profile Details ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <Field label="Name">
          {editing ? (
            <TextInput
              style={styles.fieldInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor="#334155"
              placeholder="Full name"
            />
          ) : (
            <Text style={styles.fieldValue}>{appUser?.displayName}</Text>
          )}
        </Field>

        <Field label="Email">
          <Text style={styles.fieldValue}>{appUser?.email}</Text>
        </Field>

        <Field label="Sobriety Date">
          {editing ? (
            <TextInput
              style={styles.fieldInput}
              value={sobrietyDateStr}
              onChangeText={setSobrietyDateStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#334155"
              keyboardType="numeric"
              maxLength={10}
            />
          ) : (
            <Text style={styles.fieldValue}>{sobrietyDateStr || 'Not set'}</Text>
          )}
        </Field>
      </View>

      {/* ── Recovery Goals — Selectable Tag Chips ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recovery Goals</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.goalsContainer}>
          {editing && (
            <Text style={styles.goalHint}>Tap to select your goals:</Text>
          )}
          <View style={styles.chipRow}>
            {GOAL_TAGS.map((tag) => {
              const selected = goals.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleGoal(tag)}
                  disabled={!editing}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {selected ? '✓ ' : ''}{tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {goals.length === 0 && !editing && (
            <Text style={styles.goalsEmpty}>No goals set — tap Edit to add some</Text>
          )}
        </View>
      </View>

      {/* ── Medical / Safety (Sensitive) ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety & Medical</Text>
          <View style={styles.sensitiveBadge}>
            <Text style={styles.sensitiveBadgeText}>🔒 Private</Text>
          </View>
        </View>
        <Text style={styles.medicalNote}>
          This information is stored securely and never shared with the AI assistant
          unless you explicitly ask your HVG Outlet about it.
        </Text>

        {editing ? (
          <>
            <Field label="Known Allergies">
              <TextInput
                style={styles.fieldInput}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g. Penicillin, Shellfish"
                placeholderTextColor="#334155"
                multiline
              />
            </Field>
            <Field label="Personal Triggers">
              <TextInput
                style={styles.fieldInput}
                value={triggers}
                onChangeText={setTriggers}
                placeholder="e.g. Stressful situations, certain locations"
                placeholderTextColor="#334155"
                multiline
              />
            </Field>
          </>
        ) : (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Allergies & Triggers</Text>
            <Text style={styles.fieldValue}>
              {allergies || triggers ? '••••••• (stored securely)' : 'Not set'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Notifications (edit mode only) ── */}
      {editing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <NotifRow label="Events" value={notifEvents} onChange={setNotifEvents} />
          <NotifRow label="Chores" value={notifChores} onChange={setNotifChores} />
        </View>
      )}

      {editing && (
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          <Text style={styles.saveBtnText}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Edit Full Profile in Builder ── */}
      <TouchableOpacity
        style={styles.builderBtn}
        onPress={() => router.push('/(profile-builder)/demographics' as unknown as Href)}
        activeOpacity={0.8}
      >
        <Text style={styles.builderBtnText}>📋 Edit Full Profile Builder</Text>
        <Text style={styles.builderBtnSub}>Goals, Faith, Substances & more</Text>
      </TouchableOpacity>

      {/* ── My Applications ── */}
      <TouchableOpacity
        style={styles.builderBtn}
        onPress={() => router.push('/applications/status' as unknown as Href)}
        activeOpacity={0.8}
      >
        <Text style={styles.builderBtnText}>📄 My Applications</Text>
        <Text style={styles.builderBtnSub}>Track bed, staff & program applications</Text>
      </TouchableOpacity>

      {/* ── AI Settings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HVG Outlet — AI Settings</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gemini API Key (optional)</Text>
          <Text style={[styles.fieldValue, { fontSize: 12, color: '#64748b', marginBottom: 8 }]}>
            Use your own Google AI key for higher rate limits
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={[styles.fieldInput, { flex: 1, borderWidth: 1, borderColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="AIza..."
              placeholderTextColor="#334155"
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
              <Text style={{ color: '#0891B2', fontSize: 13 }}>{showApiKey ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {apiKeySaved && (
          <Text style={{ color: '#22c55e', fontSize: 13, marginBottom: 8, paddingHorizontal: 4 }}>
            ✓ API key saved
          </Text>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, { marginTop: 4, opacity: apiKeySaving || !apiKey.trim() ? 0.5 : 1 }]}
          onPress={handleSaveApiKey}
          disabled={apiKeySaving || !apiKey.trim()}
        >
          <Text style={styles.saveBtnText}>{apiKeySaving ? 'Saving…' : 'Save API Key'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NotifRow({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.notifRow}>
      <Text style={styles.notifLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#1E3A5F', true: '#0891B2' }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1A2E' },

  profileHeader: {
    alignItems: 'center', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 16,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#0891B2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  profileName: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileEmail: { color: '#64748b', fontSize: 14, marginBottom: 10 },
  enrolledBadge: {
    backgroundColor: '#22c55e18', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#22c55e44',
  },
  enrolledBadgeText: { color: '#22c55e', fontSize: 12, fontWeight: '600' },

  sobrietyCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#0F2940', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#0891B230',
  },
  sobrietyLabel: {
    color: '#94a3b8', fontSize: 12, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8,
  },
  sobrietyDays: { color: '#0891B2', fontSize: 72, fontWeight: '800', lineHeight: 80 },
  sobrietyUnit: { color: '#94a3b8', fontSize: 16 },
  sobrietyBreakdown: { color: '#475569', fontSize: 14, marginTop: 4 },
  sobrietySince: { color: '#475569', fontSize: 12, marginTop: 4 },
  sobrietyEmpty: { color: '#475569', fontStyle: 'italic', textAlign: 'center' },

  section: { marginHorizontal: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: {
    color: '#94a3b8', fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  editBtn: { color: '#0891B2', fontWeight: '600' },

  field: {
    backgroundColor: '#0F2940', borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F',
  },
  fieldLabel: {
    color: '#64748b', fontSize: 11, textTransform: 'uppercase', marginBottom: 4,
  },
  fieldValue: { color: '#f8fafc', fontSize: 15 },
  fieldInput: { color: '#f8fafc', fontSize: 15, padding: 0 },

  // Goal chips
  goalsContainer: {
    backgroundColor: '#0F2940', borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F',
  },
  goalHint: { color: '#64748b', fontSize: 12, marginBottom: 10, fontStyle: 'italic' },
  goalsEmpty: { color: '#475569', fontStyle: 'italic', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0C1A2E', borderWidth: 1, borderColor: '#1E3A5F',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: '#0891B220', borderColor: '#0891B2',
  },
  chipText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#0891B2' },

  // Medical section
  sensitiveBadge: {
    backgroundColor: '#1E3A5F', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  sensitiveBadgeText: { color: '#60a5fa', fontSize: 11, fontWeight: '600' },
  medicalNote: {
    color: '#475569', fontSize: 12, lineHeight: 18,
    marginBottom: 10, fontStyle: 'italic',
  },

  notifRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0F2940', borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F',
  },
  notifLabel: { color: '#f8fafc', fontSize: 15 },

  saveBtn: {
    margin: 16, marginTop: 8,
    backgroundColor: '#0891B2', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Profile builder link
  builderBtn: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#0F2940', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#0891B230',
  },
  builderBtnText: { color: '#93c5fd', fontSize: 15, fontWeight: '700' },
  builderBtnSub: { color: '#475569', fontSize: 12, marginTop: 2 },

  signOutBtn: {
    margin: 16, marginTop: 8, padding: 16, alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: '#ef4444',
  },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});

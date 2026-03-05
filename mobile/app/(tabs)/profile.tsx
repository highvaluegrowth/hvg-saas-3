import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthContext';
import { userApi } from '@/lib/api/routes';
import { API_BASE_URL } from '@/lib/config';
import { useTabBarHeight } from '@/lib/constants/layout';
import {
  format,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

export default function ProfileScreen() {
  const router = useRouter();
  const { appUser, signOut, refreshAppUser, firebaseUser } = useAuth();
  const tabBarHeight = useTabBarHeight();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(appUser?.displayName ?? '');
  const [sobrietyDateStr, setSobrietyDateStr] = useState(
    appUser?.sobrietyDate
      ? format(new Date(appUser.sobrietyDate as unknown as string), 'yyyy-MM-dd')
      : ''
  );
  const [goals, setGoals] = useState<string[]>(appUser?.recoveryGoals ?? []);
  const [newGoal, setNewGoal] = useState('');
  const [notifEvents, setNotifEvents] = useState(
    appUser?.notificationPreferences?.events ?? true
  );
  const [notifChores, setNotifChores] = useState(
    appUser?.notificationPreferences?.chores ?? true
  );
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        displayName,
        sobrietyDate: sobrietyDateStr
          ? (new Date(sobrietyDateStr) as unknown as Date)
          : undefined,
        recoveryGoals: goals,
        notificationPreferences: {
          events: notifEvents,
          chores: notifChores,
          rides: true,
          messages: true,
        },
      } as Parameters<typeof userApi.updateMe>[0]),
    onSuccess: async () => {
      await refreshAppUser();
      setEditing(false);
      Alert.alert('Saved', 'Profile updated.');
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Update failed';
      Alert.alert('Error', msg);
    },
  });

  // Sobriety stats
  const sobrietyDate = appUser?.sobrietyDate
    ? new Date(appUser.sobrietyDate as unknown as string)
    : null;
  const now = new Date();
  const daysSober = sobrietyDate ? differenceInDays(now, sobrietyDate) : null;
  const years = sobrietyDate ? differenceInYears(now, sobrietyDate) : null;
  const months = sobrietyDate ? differenceInMonths(now, sobrietyDate) % 12 : null;

  function handleAddGoal() {
    const trimmed = newGoal.trim();
    if (!trimmed || goals.includes(trimmed)) return;
    setGoals([...goals, trimmed]);
    setNewGoal('');
  }

  function handleRemoveGoal(goal: string) {
    setGoals(goals.filter((g) => g !== goal));
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }

  async function handleSaveApiKey() {
    if (!apiKey.trim()) return;

    const tenantId = appUser?.tenantIds?.[0];
    if (!tenantId) {
      Alert.alert(
        'No organization linked',
        'You need to be enrolled in a sober living house to save an API key. Complete onboarding first.'
      );
      return;
    }

    setApiKeySaving(true);
    try {
      const token = await firebaseUser?.getIdToken(true);
      if (!token) throw new Error('Not authenticated');

      await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiApiKey: apiKey.trim() }),
      });
      setApiKeySaved(true);
      setApiKey('');
      Alert.alert('Saved', 'Your AI API key has been saved.');
    } catch {
      Alert.alert('Error', 'Failed to save API key.');
    } finally {
      setApiKeySaving(false);
    }
  }

  // Avatar initials
  const initials = (appUser?.displayName ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
        <Text style={styles.sobrietyLabel}>Sobriety Tracker</Text>
        {daysSober !== null ? (
          <>
            <Text style={styles.sobrietyDays}>{daysSober}</Text>
            <Text style={styles.sobrietyUnit}>days sober</Text>
            {(years ?? 0) > 0 && (
              <Text style={styles.sobrietyBreakdown}>
                {years}y {months}m
              </Text>
            )}
            <Text style={styles.sobrietySince}>
              Since {sobrietyDate ? format(sobrietyDate, 'MMMM d, yyyy') : ''}
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
              placeholderTextColor="#475569"
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
              placeholderTextColor="#475569"
            />
          ) : (
            <Text style={styles.fieldValue}>
              {sobrietyDateStr || 'Not set'}
            </Text>
          )}
        </Field>
      </View>

      {/* ── Recovery Goals (tag chips) ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recovery Goals</Text>
        </View>

        <View style={styles.goalsContainer}>
          {goals.length === 0 && (
            <Text style={styles.goalsEmpty}>
              {editing ? 'Add your first goal below' : 'No goals set — tap Edit to add some'}
            </Text>
          )}
          <View style={styles.chipRow}>
            {goals.map((goal) => (
              <View key={goal} style={styles.chip}>
                <Text style={styles.chipText}>{goal}</Text>
                {editing && (
                  <TouchableOpacity onPress={() => handleRemoveGoal(goal)} style={styles.chipRemove}>
                    <Text style={styles.chipRemoveText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {editing && (
            <View style={styles.addGoalRow}>
              <TextInput
                style={styles.addGoalInput}
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder="Add a goal…"
                placeholderTextColor="#475569"
                returnKeyType="done"
                onSubmitEditing={handleAddGoal}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.addGoalBtn, !newGoal.trim() && { opacity: 0.4 }]}
                onPress={handleAddGoal}
                disabled={!newGoal.trim()}
              >
                <Text style={styles.addGoalBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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

      {/* ── AI Settings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HVG Guide — AI Settings</Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gemini API Key (optional)</Text>
          <Text style={[styles.fieldValue, { fontSize: 12, color: '#64748b', marginBottom: 8 }]}>
            Use your own Google AI key for higher rate limits
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={[styles.fieldInput, { flex: 1, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="AIza..."
              placeholderTextColor="#475569"
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
              <Text style={{ color: '#6366f1', fontSize: 13 }}>{showApiKey ? 'Hide' : 'Show'}</Text>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NotifRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.notifRow}>
      <Text style={styles.notifLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#334155', true: '#6366f1' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 10,
  },
  enrolledBadge: {
    backgroundColor: '#22c55e18',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#22c55e44',
  },
  enrolledBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },

  // Sobriety card
  sobrietyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sobrietyLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sobrietyDays: {
    color: '#6366f1',
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  sobrietyUnit: { color: '#94a3b8', fontSize: 16 },
  sobrietyBreakdown: { color: '#475569', fontSize: 14, marginTop: 4 },
  sobrietySince: { color: '#475569', fontSize: 12, marginTop: 4 },
  sobrietyEmpty: { color: '#475569', fontStyle: 'italic', textAlign: 'center' },

  section: { marginHorizontal: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: { color: '#6366f1', fontWeight: '600' },
  field: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: { color: '#f8fafc', fontSize: 15 },
  fieldInput: { color: '#f8fafc', fontSize: 15, padding: 0 },

  // Goals chips
  goalsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  goalsEmpty: {
    color: '#475569',
    fontStyle: 'italic',
    fontSize: 14,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f120',
    borderWidth: 1,
    borderColor: '#6366f144',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '500',
  },
  chipRemove: {
    marginLeft: 6,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: {
    color: '#a5b4fc',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
  addGoalRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  addGoalInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addGoalBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addGoalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  notifLabel: { color: '#f8fafc', fontSize: 15 },
  saveBtn: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  signOutBtn: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});

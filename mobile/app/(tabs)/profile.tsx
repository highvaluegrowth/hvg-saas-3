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
import { useAuth } from '@/lib/auth/AuthContext';
import { userApi } from '@/lib/api/routes';
import {
  format,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

export default function ProfileScreen() {
  const { appUser, signOut, refreshAppUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(appUser?.displayName ?? '');
  const [sobrietyDateStr, setSobrietyDateStr] = useState(
    appUser?.sobrietyDate
      ? format(new Date(appUser.sobrietyDate as unknown as string), 'yyyy-MM-dd')
      : ''
  );
  const [goals, setGoals] = useState(
    (appUser?.recoveryGoals ?? []).join(', ')
  );
  const [notifEvents, setNotifEvents] = useState(
    appUser?.notificationPreferences?.events ?? true
  );
  const [notifChores, setNotifChores] = useState(
    appUser?.notificationPreferences?.chores ?? true
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      userApi.updateMe({
        displayName,
        sobrietyDate: sobrietyDateStr
          ? (new Date(sobrietyDateStr) as unknown as Date)
          : undefined,
        recoveryGoals: goals
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
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

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      {/* Sobriety Tracker */}
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
          <Text style={styles.sobrietyEmpty}>Set your sobriety date below</Text>
        )}
      </View>

      {/* Profile Details */}
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

        <Field label="Recovery Goals">
          {editing ? (
            <TextInput
              style={styles.fieldInput}
              value={goals}
              onChangeText={setGoals}
              placeholder="Comma-separated goals"
              placeholderTextColor="#475569"
              multiline
            />
          ) : (
            <Text style={styles.fieldValue}>
              {(appUser?.recoveryGoals ?? []).join(', ') || 'None set'}
            </Text>
          )}
        </Field>
      </View>

      {/* Notifications */}
      {editing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <NotifRow
            label="Events"
            value={notifEvents}
            onChange={setNotifEvents}
          />
          <NotifRow
            label="Chores"
            value={notifChores}
            onChange={setNotifChores}
          />
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

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
  sobrietyCard: {
    margin: 16,
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
  sobrietyEmpty: { color: '#475569', fontStyle: 'italic' },
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
    marginBottom: 32,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});

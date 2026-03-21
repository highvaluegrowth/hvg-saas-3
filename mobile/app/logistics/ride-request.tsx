import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useAuth } from '@/lib/auth/AuthContext';
import { userApi } from '@/lib/api/routes';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/theme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// ─── Constants ────────────────────────────────────────────────────────────────

const PURPOSES = [
  'Medical Appointment',
  'Job Interview / Work',
  'Grocery / Errands',
  'Counseling / Therapy',
  'Court / Legal',
  'Other',
];

// ─── Ride Request Screen ──────────────────────────────────────────────────────

export default function RideRequestScreen() {
  const { firebaseUser, appUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const uid = firebaseUser?.uid ?? null;

  // Resolve tenantId
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: userApi.getEnrollments,
    staleTime: 5 * 60 * 1000,
  });
  const activeEnrollment =
    enrollmentsData?.enrollments?.find(
      (e: any) => e.status === 'active' || e.status === 'approved'
    ) ?? null;
  const tenantId: string | null =
    activeEnrollment?.tenantId ?? (appUser as any)?.tenantId ?? null;

  // Form state
  const [destination, setDestination] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = destination.trim().length > 0 && selectedPurpose.length > 0 && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !uid || !tenantId) return;

    setSubmitting(true);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    try {
      // Write directly to Firestore with pending_triage to trigger
      // the "Action Required" column on the Operator's Kanban board
      await firestore()
        .collection('tenants')
        .doc(tenantId)
        .collection('rides')
        .add({
          destination: destination.trim(),
          purpose: selectedPurpose,
          notes: notes.trim() || null,
          status: 'pending_triage',
          requestedBy: uid,
          passengerIds: [uid],
          requestedAt: firestore.FieldValue.serverTimestamp(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      Alert.alert(
        'Ride Requested',
        'Your ride request has been submitted and is pending approval.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Could not submit your ride request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, uid, tenantId, destination, selectedPurpose, notes, router]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request a Ride</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Destination */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Destination *</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="place" size={18} color={colors.text.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="Where do you need to go?"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={200}
              />
            </View>
          </View>

          {/* Purpose */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Purpose *</Text>
            <View style={styles.purposeGrid}>
              {PURPOSES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.purposeChip,
                    selectedPurpose === p && styles.purposeChipSelected,
                  ]}
                  onPress={() => setSelectedPurpose(p)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.purposeChipText,
                      selectedPurpose === p && styles.purposeChipTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional details for your driver…"
              placeholderTextColor={colors.text.muted}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info-outline" size={16} color={colors.primary.DEFAULT} />
            <Text style={styles.infoText}>
              Your request will go to the house manager for approval. You'll be notified once confirmed.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            accessibilityLabel="Submit ride request"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="directions-car" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },

  // Form
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Text inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 100,
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flex: 0,
  },
  charCount: {
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: 2,
  },

  // Purpose chips
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  purposeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.bg.elevated,
  },
  purposeChipSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.glow,
  },
  purposeChipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  purposeChipTextSelected: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primary.glow,
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary.light,
    lineHeight: 18,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary.dark,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

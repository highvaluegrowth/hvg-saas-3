import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tenantApi } from '@/lib/api/routes';

const TYPE_LABELS: Record<string, string> = {
  group_meeting: 'Group Meeting',
  house_meeting: 'House Meeting',
  class: 'Class',
  course: 'Course',
  na_meeting: 'NA Meeting',
  aa_meeting: 'AA Meeting',
  church: 'Church',
  bible_study: 'Bible Study',
  therapy_session: 'Therapy Session',
  job_training: 'Job Training',
  community_service: 'Community Service',
  outing: 'Outing',
  other: 'Other',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { tenantId, eventId } = useLocalSearchParams<{ tenantId: string; eventId: string }>();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Reuse the cached events list — no extra network request needed
  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', tenantId],
    queryFn: () => tenantApi.getEvents(tenantId),
    select: (d) => d.events.find((e) => e.id === eventId),
  });

  const attendMutation = useMutation({
    mutationFn: () => tenantApi.attendEvent(tenantId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', tenantId] });
      Alert.alert('RSVP Confirmed', 'You are attending this event.');
    },
    onError: (e: unknown) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to RSVP');
    },
  });

  const unattendMutation = useMutation({
    mutationFn: () => tenantApi.unattendEvent(tenantId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', tenantId] });
      Alert.alert('RSVP Cancelled', 'You are no longer attending this event.');
    },
    onError: (e: unknown) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to cancel RSVP');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) => tenantApi.verifyEvent(tenantId, eventId, code),
    onSuccess: (data) => {
      if (data.verified) {
        queryClient.invalidateQueries({ queryKey: ['events', tenantId] });
        Alert.alert('Attendance Verified', 'Your presence has been confirmed.');
        setShowVerifyModal(false);
        setPin('');
      }
    },
    onError: (e: unknown) => {
      Alert.alert('Verification Failed', e instanceof Error ? e.message : 'Invalid code');
    },
  });

  const isBusy = attendMutation.isPending || unattendMutation.isPending || verifyMutation.isPending;
  const typeLabel = event?.type ? (TYPE_LABELS[event.type] ?? event.type) : null;
  const isAttending = event?.isAttending || false;
  // Fallback false since API might not explicitly return isVerified yet in getEvents
  // The user wouldn't see the verify button if they weren't attending anyway.
  const isVerified = false; 

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Event Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : isError || !event ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={48} color="#334155" />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Type badge */}
            {typeLabel ? (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{typeLabel}</Text>
              </View>
            ) : null}

            {/* Details card */}
            <View style={styles.card}>
              {/* Date & Time */}
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Ionicons name="calendar-outline" size={18} color="#6366f1" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Date &amp; Time</Text>
                  <Text style={styles.rowValue}>
                    {format(new Date(event.scheduledAt), "EEEE, MMMM d, yyyy")}
                  </Text>
                  <Text style={styles.rowValue}>
                    {format(new Date(event.scheduledAt), "h:mm a")}
                  </Text>
                </View>
              </View>

              {/* Duration */}
              {event.duration ? (
                <View style={styles.row}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="time-outline" size={18} color="#6366f1" />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Duration</Text>
                    <Text style={styles.rowValue}>{formatDuration(event.duration)}</Text>
                  </View>
                </View>
              ) : null}

              {/* Location */}
              {event.location ? (
                <View style={styles.row}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="location-outline" size={18} color="#6366f1" />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Location</Text>
                    <Text style={styles.rowValue}>{event.location}</Text>
                  </View>
                </View>
              ) : null}

              {/* Attendees */}
              <View style={[styles.row, styles.rowLast]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="people-outline" size={18} color="#6366f1" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Attending</Text>
                  <Text style={styles.rowValue}>
                    {event.attendeeCount}{' '}
                    {event.attendeeCount === 1 ? 'person' : 'people'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky bottom RSVP bar */}
          <View style={styles.bottomBar}>
            {event.requireVerification && isAttending && !isVerified && (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => setShowVerifyModal(true)}
                disabled={isBusy}
              >
                <Text style={styles.verifyBtnText}>I&apos;m Here (Verify Attendance)</Text>

              </TouchableOpacity>
            )}

            {!isAttending ? (
              <TouchableOpacity
                style={[styles.rsvpBtn, isBusy && styles.btnDisabled]}
                onPress={() => attendMutation.mutate()}
                disabled={isBusy}
              >
                <Text style={styles.rsvpBtnText}>
                  {attendMutation.isPending ? 'Sending…' : 'RSVP to Event'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.cancelBtn, isBusy && styles.btnDisabled]}
                onPress={() => unattendMutation.mutate()}
                disabled={isBusy}
              >
                <Text style={styles.cancelBtnText}>
                  {unattendMutation.isPending ? 'Cancelling…' : 'Cancel RSVP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verification Modal */}
          <Modal visible={showVerifyModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Verify Attendance</Text>
                <Text style={styles.modalSub}>Enter the 4-digit code provided at the event.</Text>
                
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="0000"
                  placeholderTextColor="#475569"
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.modalCancel} 
                    onPress={() => setShowVerifyModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalSubmit, pin.length !== 4 && styles.btnDisabled]} 
                    onPress={() => verifyMutation.mutate(pin)}
                    disabled={pin.length !== 4 || verifyMutation.isPending}
                  >
                    <Text style={styles.modalSubmitText}>
                      {verifyMutation.isPending ? 'Checking...' : 'Verify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: { width: 30 }, // balances the back button width

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: { color: '#94a3b8', fontSize: 16, marginTop: 8 },
  backLink: { marginTop: 4 },
  backLinkText: { color: '#6366f1', fontSize: 15 },

  // Content
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#312e81',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
  },
  typeBadgeText: { color: '#a5b4fc', fontSize: 12, fontWeight: '600' },

  // Details card
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 32,
    marginRight: 12,
    paddingTop: 1,
  },
  rowContent: { flex: 1 },
  rowLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  rowValue: { color: '#e2e8f0', fontSize: 15 },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  rsvpBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rsvpBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },

  // Verification Button
  verifyBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalSub: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
  pinInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: 10,
    marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
  modalSubmit: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  format,
  isToday,
  isTomorrow,
  startOfDay,
  differenceInDays,
  isThisISOWeek,
} from 'date-fns';

import { useAuth } from '@/lib/auth/AuthContext';
import { userApi, tenantApi, MobileEvent } from '@/lib/api/routes';
import { colors } from '@/lib/constants/theme';
import { TAB_BAR_BASE_HEIGHT } from '@/lib/constants/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarSection {
  title: string;
  data: MobileEvent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupEventsByDate(events: MobileEvent[]): CalendarSection[] {
  const today = startOfDay(new Date());
  const buckets: Record<string, MobileEvent[]> = {
    Today: [],
    Tomorrow: [],
    'This Week': [],
    'Next Week': [],
    Later: [],
  };

  for (const event of events) {
    const eventDate = new Date(event.scheduledAt);
    const diff = differenceInDays(startOfDay(eventDate), today);

    if (diff === 0) buckets['Today'].push(event);
    else if (diff === 1) buckets['Tomorrow'].push(event);
    else if (diff <= 6) buckets['This Week'].push(event);
    else if (diff <= 13) buckets['Next Week'].push(event);
    else buckets['Later'].push(event);
  }

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  meeting: 'groups',
  house_meeting: 'home',
  aa: 'self-improvement',
  na: 'self-improvement',
  '12_step': 'self-improvement',
  class: 'school',
  workshop: 'construction',
  social: 'celebration',
};

function eventIcon(type?: string): string {
  if (!type) return 'event';
  return EVENT_TYPE_ICONS[type.toLowerCase()] ?? 'event';
}

function isMandatory(type?: string): boolean {
  return ['meeting', 'house_meeting'].includes(type?.toLowerCase() ?? '');
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  tenantId,
  onAttendChange,
}: {
  event: MobileEvent;
  tenantId: string;
  onAttendChange?: (eventId: string, attending: boolean) => void;
}) {
  const [attending, setAttending] = useState(false);
  const [saving, setSaving] = useState(false);

  const eventDate = new Date(event.scheduledAt);
  const timeStr = format(eventDate, 'h:mm a');
  const mandatory = isMandatory(event.type);

  const handleRSVP = useCallback(async () => {
    if (saving) return;

    const next = !attending;

    // Optimistic UI
    setAttending(next);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    setSaving(true);
    try {
      if (next) {
        await tenantApi.attendEvent(tenantId, event.id);
      } else {
        await tenantApi.unattendEvent(tenantId, event.id);
      }
      onAttendChange?.(event.id, next);
    } catch {
      // Revert
      setAttending(!next);
      Alert.alert(
        'Error',
        `Could not ${next ? 'RSVP to' : 'cancel RSVP for'} this event. Please try again.`
      );
    } finally {
      setSaving(false);
    }
  }, [attending, saving, tenantId, event.id, onAttendChange]);

  return (
    <View style={[styles.eventCard, mandatory && styles.eventCardMandatory]}>
      {/* Left accent + icon */}
      <View style={[styles.eventIconWrap, mandatory && styles.eventIconWrapMandatory]}>
        <MaterialIcons
          name={eventIcon(event.type) as any}
          size={20}
          color={mandatory ? colors.primary.DEFAULT : colors.text.secondary}
        />
      </View>

      {/* Body */}
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {mandatory && (
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryText}>Required</Text>
            </View>
          )}
        </View>

        <View style={styles.eventMeta}>
          <MaterialIcons name="schedule" size={12} color={colors.text.muted} />
          <Text style={styles.eventMetaText}>{timeStr}</Text>
          {event.duration ? (
            <>
              <Text style={styles.eventMetaDot}>·</Text>
              <Text style={styles.eventMetaText}>{event.duration} min</Text>
            </>
          ) : null}
        </View>

        {event.location ? (
          <View style={styles.eventMeta}>
            <MaterialIcons name="place" size={12} color={colors.text.muted} />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        ) : null}

        {event.attendeeCount > 0 && (
          <Text style={styles.attendeeCount}>
            {event.attendeeCount} attending
          </Text>
        )}
      </View>

      {/* RSVP button */}
      <TouchableOpacity
        style={[styles.rsvpBtn, attending && styles.rsvpBtnAttending]}
        onPress={handleRSVP}
        disabled={saving}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={attending ? 'Cancel RSVP' : 'RSVP to event'}
      >
        {saving ? (
          <ActivityIndicator
            size={14}
            color={attending ? colors.success.DEFAULT : colors.primary.DEFAULT}
          />
        ) : attending ? (
          <>
            <MaterialIcons name="check" size={14} color={colors.success.DEFAULT} />
            <Text style={styles.rsvpTextAttending}>Going</Text>
          </>
        ) : (
          <Text style={styles.rsvpText}>RSVP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Events Screen ────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const { appUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + insets.bottom + 16;

  // Get enrolled tenant
  const { data: enrollmentsData, isLoading: enrollLoading } = useQuery({
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

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['events', tenantId],
    queryFn: () => tenantApi.getEvents(tenantId!),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });

  const events: MobileEvent[] = eventsData?.events ?? [];
  const sections = groupEventsByDate(events);
  const isLoading = enrollLoading || eventsLoading;

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
          <Text style={styles.headerTitle}>Events & Meetings</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
        </View>
      ) : error || !tenantId ? (
        <View style={styles.centered}>
          <MaterialIcons name="event-busy" size={40} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>
            {!tenantId ? 'No active enrollment' : 'Could not load events'}
          </Text>
          <Text style={styles.emptyText}>
            {!tenantId
              ? 'Apply for a bed to see house events.'
              : 'Pull down to try again.'}
          </Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="event-available" size={40} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No upcoming events</Text>
          <Text style={styles.emptyText}>Check back soon for new house events.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>
          )}
          renderItem={({ item }) =>
            tenantId ? (
              <EventCard event={item} tenantId={tenantId} />
            ) : null
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

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

  // Loading / Empty
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Section headers
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.DEFAULT,
  },

  // Event card
  eventCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  eventCardMandatory: {
    borderColor: colors.primary.dark + '88',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.DEFAULT,
  },
  eventIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  eventIconWrapMandatory: {
    backgroundColor: colors.primary.glow,
  },
  eventBody: {
    flex: 1,
    gap: 4,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flexWrap: 'wrap',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  mandatoryBadge: {
    backgroundColor: colors.primary.glow,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  mandatoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  eventMetaDot: {
    fontSize: 12,
    color: colors.text.muted,
  },
  attendeeCount: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },

  // RSVP button
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary.dark,
    flexShrink: 0,
    alignSelf: 'center',
    minWidth: 64,
    minHeight: 34,
    justifyContent: 'center',
  },
  rsvpBtnAttending: {
    borderColor: colors.success.DEFAULT,
    backgroundColor: colors.success.DEFAULT + '18',
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  rsvpTextAttending: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success.DEFAULT,
  },
});

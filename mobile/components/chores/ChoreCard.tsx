import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { colors } from '@/lib/constants/theme';

export interface ChoreItem {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: colors.primary.DEFAULT,
  low: '#64748b',
};

export function ChoreCard({ chore }: { chore: ChoreItem }) {
  const [optimisticDone, setOptimisticDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleComplete = useCallback(async () => {
    if (optimisticDone || saving) return;

    // Optimistic update — instant visual feedback
    setOptimisticDone(true);
    ReactNativeHapticFeedback.trigger('notificationSuccess', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    setSaving(true);
    try {
      await firestore()
        .collection('tenants')
        .doc(chore.tenantId)
        .collection('chores')
        .doc(chore.id)
        .update({
          status: 'completed',
          completedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch {
      // Revert on failure
      setOptimisticDone(false);
      Alert.alert('Error', 'Could not complete chore. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [chore, optimisticDone, saving]);

  if (optimisticDone) {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <View style={styles.checkArea}>
          <MaterialIcons name="check-circle" size={24} color={colors.success.DEFAULT} />
        </View>
        <Text style={styles.titleDone} numberOfLines={1}>
          {chore.title}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          {chore.priority && chore.priority !== 'low' && (
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: PRIORITY_COLORS[chore.priority] ?? '#64748b' },
              ]}
            />
          )}
          <Text style={styles.title} numberOfLines={2}>
            {chore.title}
          </Text>
        </View>

        {chore.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {chore.description}
          </Text>
        ) : null}

        {chore.dueDate ? (
          <View style={styles.duePill}>
            <MaterialIcons name="schedule" size={11} color={colors.primary.light} />
            <Text style={styles.dueText}>
              Due{' '}
              {new Date(chore.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 44×44 minimum hit area */}
      <TouchableOpacity
        onPress={handleComplete}
        style={styles.checkBtn}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Mark chore complete"
        accessibilityRole="button"
      >
        <MaterialIcons
          name="radio-button-unchecked"
          size={26}
          color={saving ? colors.text.muted : colors.primary.DEFAULT}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    minHeight: 60,
  },
  cardDone: {
    opacity: 0.45,
    borderColor: colors.success.DEFAULT + '44',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  title: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  titleDone: {
    color: colors.text.muted,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    flex: 1,
  },
  desc: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dueText: {
    color: colors.primary.light,
    fontSize: 11,
    fontWeight: '600',
  },
  checkBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

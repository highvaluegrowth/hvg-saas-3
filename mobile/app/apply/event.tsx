import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { applicationApi } from '@/lib/api/routes';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function EventApplicationScreen() {
  const { eventId, title } = useLocalSearchParams<{ eventId: string; title: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await applicationApi.submitEvent({
        eventId,
        eventTitle: title,
        notes: notes.trim(),
      });
      if (res.success) {
        Alert.alert('Success', 'You have applied for this event.');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Event Registration' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="event" size={32} color="#10b981" />
          </View>
          <Text style={styles.title}>{title || 'Event Registration'}</Text>
          <Text style={styles.subtitle}>Register your interest in this community event.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Special requests, dietary needs, or questions..."
            placeholderTextColor="#475569"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Registration</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { padding: 24, gap: 32 },
  header: { alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#10b98122', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#f8fafc', marginLeft: 4 },
  textArea: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
    color: '#f8fafc', fontSize: 15, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#334155', minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

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

export default function CourseApplicationScreen() {
  const { courseId, title } = useLocalSearchParams<{ courseId: string; title: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please tell us why you want to take this course.');
      return;
    }

    setLoading(true);
    try {
      const res = await applicationApi.submitCourse({
        courseId,
        courseTitle: title,
        reason: reason.trim(),
      });
      if (res.success) {
        Alert.alert('Success', 'Your application has been submitted for review.');
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
      <Stack.Screen options={{ title: 'Course Application' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="school" size={32} color="#6366f1" />
          </View>
          <Text style={styles.title}>{title || 'Course Registration'}</Text>
          <Text style={styles.subtitle}>Apply to enroll in this universal learning program.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Why are you interested in this course?</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="Tell us a bit about your goals..."
            placeholderTextColor="#475569"
            value={reason}
            onChangeText={setReason}
          />
          <Text style={styles.hint}>Your application will be reviewed by the HVG academic team.</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Reuse styles from other apply screens or define here
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { padding: 24, gap: 32 },
  header: { alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#6366f122', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#f8fafc', marginLeft: 4 },
  textArea: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
    color: '#f8fafc', fontSize: 15, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#334155', minHeight: 120,
  },
  hint: { fontSize: 12, color: '#475569', marginLeft: 4 },
  submitBtn: {
    backgroundColor: '#6366f1', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', shadowColor: '#6366f1', shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

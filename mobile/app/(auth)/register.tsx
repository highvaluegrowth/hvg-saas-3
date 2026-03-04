import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { authApi } from '@/lib/api/routes';

type Intent = 'resident' | 'operator';

export default function RegisterScreen() {
  const [step, setStep] = useState<0 | 1>(0);
  const [intent, setIntent] = useState<Intent>('resident');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!displayName || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ email: email.trim(), displayName, password });
      await auth().signInWithEmailAndPassword(email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      Alert.alert('Registration failed', msg);
    } finally {
      setLoading(false);
    }
  }

  function handleOperatorTap() {
    Alert.alert(
      'Operator Tools on Desktop',
      'HVG operator tools (house management, staff, LMS, marketing, analytics) are available at app.hvg.app on desktop or tablet.\n\nThe mobile app is optimised for residents in recovery.',
      [{ text: 'Got it', style: 'default' }]
    );
  }

  // ── Step 0: Intent picker ──────────────────────────────────────────────────
  if (step === 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text style={styles.title}>Welcome to HVG</Text>
          <Text style={styles.subtitle}>What best describes you?</Text>

          {/* Resident card */}
          <TouchableOpacity
            style={[styles.intentCard, { borderColor: '#10b981' }]}
            onPress={() => { setIntent('resident'); setStep(1); }}
            activeOpacity={0.85}
          >
            <View style={[styles.intentIconBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.intentIconText}>R</Text>
            </View>
            <View style={styles.intentText}>
              <Text style={[styles.intentLabel, { color: '#10b981' }]}>I am in recovery</Text>
              <Text style={styles.intentDesc}>Find a sober living bed, track your journey, get AI-powered support</Text>
            </View>
          </TouchableOpacity>

          {/* Operator card — redirects to web */}
          <TouchableOpacity
            style={[styles.intentCard, { borderColor: '#6366f1' }]}
            onPress={handleOperatorTap}
            activeOpacity={0.85}
          >
            <View style={[styles.intentIconBadge, { backgroundColor: '#6366f1' }]}>
              <Text style={styles.intentIconText}>H</Text>
            </View>
            <View style={styles.intentText}>
              <Text style={[styles.intentLabel, { color: '#6366f1' }]}>I manage a recovery house</Text>
              <Text style={styles.intentDesc}>Operator tools available at app.hvg.app on desktop</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Step 1: Registration form ──────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <TouchableOpacity onPress={() => setStep(0)} style={styles.backButton}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          {intent === 'resident' ? 'Start your recovery journey' : 'Join HVG'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#64748b"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 chars)"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  intentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  intentIconBadge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  intentIconText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  intentText: { flex: 1 },
  intentLabel: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  intentDesc: { fontSize: 12, color: '#94a3b8', lineHeight: 17 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: '#64748b', fontSize: 14 },
  input: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#6366f1', textAlign: 'center', marginTop: 20, fontSize: 14 },
});

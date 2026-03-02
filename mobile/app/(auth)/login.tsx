import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { authApi } from '@/lib/api/routes';

const WEB_CLIENT_ID = '749140510309-4p7jfdv7jefdn9l00ali3bb5s3l3hden.apps.googleusercontent.com';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: true });
  }, []);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      // Route through auth gate so it can check preferences/profileComplete
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token from Google');

      // Sign in to Firebase with Google credential
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);

      // JIT-provision AppUser + resident claim on our backend
      await authApi.loginWithGoogle();

      // Route through auth gate
      router.replace('/');
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — no alert needed
      } else if (code === statusCodes.IN_PROGRESS) {
        Alert.alert('Sign-in already in progress');
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Play Services not available on this device');
      } else {
        const msg = error instanceof Error ? error.message : 'Google sign-in failed';
        Alert.alert('Sign-in failed', msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>High Value Growth</Text>
        <Text style={styles.subtitle}>Recovery Support</Text>

        {/* Google Sign-In */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / Password */}
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
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Don&apos;t have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#f8fafc', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { fontSize: 13, color: '#64748b' },

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
    marginTop: 4,
    marginBottom: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#6366f1', textAlign: 'center', marginTop: 20, fontSize: 14 },
});

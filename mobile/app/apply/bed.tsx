import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { applicationApi } from '@/lib/api/routes';

interface FormData {
  name: string;
  email: string;
  phone: string;
  zipCode: string;
  maxDistance: string;
  gender: string;
  raceEthnicity: string;
  incomeBracket: string;
  sobrietyDate: string;
  primarySubstance: string;
  isOpioidUse: boolean;
  goals: string;
  fundingSource: string;
}

export default function BedApplicationScreen() {
  const router = useRouter();
  const { tenantId, houseId } = useLocalSearchParams<{ tenantId?: string; houseId?: string }>();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    maxDistance: '25',
    gender: '',
    raceEthnicity: '',
    incomeBracket: '',
    sobrietyDate: '',
    primarySubstance: '',
    isOpioidUse: false,
    goals: '',
    fundingSource: '',
  });

  const update = (key: keyof FormData, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await applicationApi.submitBed({
        requestedTenantId: tenantId || null,
        requestedHouseId: houseId || null,
        applicantName: formData.name,
        applicantEmail: formData.email,
        zipCode: formData.zipCode,
        data: {
          phone: formData.phone,
          maxDistance: parseInt(formData.maxDistance),
          gender: formData.gender,
          raceEthnicity: formData.raceEthnicity,
          incomeBracket: formData.incomeBracket,
          sobrietyDate: formData.sobrietyDate,
          primarySubstance: formData.primarySubstance,
          isOpioidUse: formData.isOpioidUse,
          goals: formData.goals,
          fundingSource: formData.fundingSource,
        },
      });
      router.replace('/applications/status');
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'There was an issue submitting your application. Please try again.';
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[styles.stepDot, s === step && styles.stepDotActive, s < step && styles.stepDotDone]}
            >
              <Text style={[styles.stepDotText, (s === step || s < step) && styles.stepDotTextActive]}>
                {s}
              </Text>
            </View>
          ))}
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Personal Info</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => update('name', v)}
              placeholder="Your full name"
              placeholderTextColor="#475569"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(v) => update('email', v)}
              placeholder="your@email.com"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="(555) 000-0000"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>ZIP Code *</Text>
            <TextInput
              style={styles.input}
              value={formData.zipCode}
              onChangeText={(v) => update('zipCode', v)}
              placeholder="12345"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={10}
            />

            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={styles.input}
              value={formData.gender}
              onChangeText={(v) => update('gender', v)}
              placeholder="e.g. Male, Female, Non-binary..."
              placeholderTextColor="#475569"
            />

            <Text style={styles.label}>Max Travel Distance (miles) *</Text>
            <TextInput
              style={styles.input}
              value={formData.maxDistance}
              onChangeText={(v) => update('maxDistance', v)}
              placeholder="25"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Race / Ethnicity</Text>
            <TextInput
              style={styles.input}
              value={formData.raceEthnicity}
              onChangeText={(v) => update('raceEthnicity', v)}
              placeholder="White, Black, Hispanic..."
              placeholderTextColor="#475569"
            />

            <Text style={styles.label}>Annual Income Bracket</Text>
            <TextInput
              style={styles.input}
              value={formData.incomeBracket}
              onChangeText={(v) => update('incomeBracket', v)}
              placeholder="e.g. $0 - $15k, $15k - $30k..."
              placeholderTextColor="#475569"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Recovery Profile</Text>

            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={[styles.checkbox, formData.isOpioidUse && styles.checkboxActive]} 
                onPress={() => update('isOpioidUse', !formData.isOpioidUse)}
              >
                {formData.isOpioidUse && <Text style={styles.checkboxTick}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>History of Opioid Use? (SOR Grant Eligibility)</Text>
            </View>

            <Text style={styles.label}>Sobriety / Clean Date</Text>
            <TextInput
              style={styles.input}
              value={formData.sobrietyDate}
              onChangeText={(v) => update('sobrietyDate', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#475569"
            />

            <Text style={styles.label}>Primary Substance</Text>
            <TextInput
              style={styles.input}
              value={formData.primarySubstance}
              onChangeText={(v) => update('primarySubstance', v)}
              placeholder="e.g. Alcohol, Opioids..."
              placeholderTextColor="#475569"
            />

            <Text style={styles.label}>Goals</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={formData.goals}
              onChangeText={(v) => update('goals', v)}
              placeholder="Describe your recovery goals..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Funding Source</Text>
            <TextInput
              style={styles.input}
              value={formData.fundingSource}
              onChangeText={(v) => update('fundingSource', v)}
              placeholder="Insurance, self-pay, scholarship..."
              placeholderTextColor="#475569"
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>Review & Submit</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewSectionLabel}>Personal Info</Text>
              <ReviewRow label="Name" value={formData.name} />
              <ReviewRow label="Email" value={formData.email} />
              <ReviewRow label="Phone" value={formData.phone} />
              <ReviewRow label="ZIP Code" value={formData.zipCode} />
              <ReviewRow label="Max Distance" value={`${formData.maxDistance} miles`} />
              <ReviewRow label="Gender" value={formData.gender} />
              <ReviewRow label="Race/Ethnicity" value={formData.raceEthnicity} />
              <ReviewRow label="Income Bracket" value={formData.incomeBracket} />
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewSectionLabel}>Recovery Profile</Text>
              <ReviewRow label="Opioid Use History" value={formData.isOpioidUse ? 'Yes' : 'No'} />
              <ReviewRow label="Sobriety Date" value={formData.sobrietyDate} />
              <ReviewRow label="Primary Substance" value={formData.primarySubstance} />
              <ReviewRow label="Goals" value={formData.goals} />
              <ReviewRow label="Funding" value={formData.fundingSource} />
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextBtn, step === 1 && styles.nextBtnFull]}
              onPress={() => setStep((s) => s + 1)}
            >
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, backgroundColor: '#0f172a' },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { borderColor: '#10b981', backgroundColor: '#10b981' },
  stepDotDone: { borderColor: '#10b981', backgroundColor: '#065f46' },
  stepDotText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  stepDotTextActive: { color: '#fff' },

  // Step content
  stepContent: { paddingHorizontal: 20, paddingBottom: 8 },
  stepHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
  },

  // Form fields
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: { height: 100, paddingTop: 12 },

  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: { backgroundColor: '#10b981' },
  checkboxTick: { color: '#fff', fontWeight: '900', fontSize: 14 },
  checkboxLabel: { color: '#f8fafc', fontSize: 14, flex: 1 },

  // Review card
  reviewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewSectionLabel: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  reviewLabel: { color: '#64748b', fontSize: 13, flex: 1 },
  reviewValue: { color: '#f8fafc', fontSize: 13, flex: 2, textAlign: 'right' },

  // Navigation
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
  nextBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextBtnFull: { flex: 1 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },



  bottomSpacer: { height: 40 },
});

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput,
    TouchableOpacity, ScrollView, KeyboardAvoidingView,
    Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { AppUser } from '@shared/types/appUser';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;
const STEP = 1;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemographicsScreen() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');                       // YYYY-MM-DD
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [recoveryStartDate, setRecoveryStartDate] = useState(''); // YYYY-MM-DD

    const canContinue = fullName.trim().length > 0;

    async function handleContinue() {
        if (!canContinue || saving) return;
        setSaving(true);
        try {
            const patch: Partial<AppUser> = {
                displayName: fullName.trim(),
            };
            if (recoveryStartDate.trim()) {
                patch.sobrietyCleanSince = recoveryStartDate.trim();
            }
            // Store emergency contact + DOB in the additional fields
            // These are handled server-side via the AppUser update route
            await userApi.updateMe({
                ...patch,
                // @ts-expect-error — extended fields stored server-side, types updated in shared when needed
                dateOfBirth: dob.trim() || undefined,
                emergencyContact: (emergencyName.trim() || emergencyPhone.trim())
                    ? { name: emergencyName.trim(), phone: emergencyPhone.trim() }
                    : undefined,
            });
            router.push('/(profile-builder)/sobriety-status');
        } catch {
            // Fail silently — allow users to skip if offline
            router.push('/(profile-builder)/sobriety-status');
        } finally {
            setSaving(false);
        }
    }

    function handleSkip() {
        router.push('/(profile-builder)/sobriety-status');
    }

    return (
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Progress bar */}
            <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
            </View>

            <ScrollView
                contentContainerStyle={s.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={s.header}>
                    <View style={s.stepPill}>
                        <Text style={s.stepText}>Step {STEP} of {TOTAL_STEPS}</Text>
                    </View>
                    <Text style={s.title}>Tell us about yourself</Text>
                    <Text style={s.subtitle}>
                        This helps your HVG Outlet personalise your experience and
                        ensures the team can reach you in an emergency.
                    </Text>
                </View>

                {/* ── Full Name ── */}
                <Field label="Full Name *" required>
                    <TextInput
                        style={s.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Your full legal name"
                        placeholderTextColor="#334155"
                        autoCapitalize="words"
                        returnKeyType="next"
                    />
                </Field>

                {/* ── Date of Birth ── */}
                <Field label="Date of Birth" hint="YYYY-MM-DD">
                    <TextInput
                        style={s.input}
                        value={dob}
                        onChangeText={setDob}
                        placeholder="1990-01-15"
                        placeholderTextColor="#334155"
                        keyboardType="numeric"
                        maxLength={10}
                        returnKeyType="next"
                    />
                </Field>

                {/* ── Recovery Start Date ── */}
                <Field label="Recovery Start Date" hint="YYYY-MM-DD — when your recovery journey began">
                    <TextInput
                        style={s.input}
                        value={recoveryStartDate}
                        onChangeText={setRecoveryStartDate}
                        placeholder="2024-03-01"
                        placeholderTextColor="#334155"
                        keyboardType="numeric"
                        maxLength={10}
                        returnKeyType="next"
                    />
                </Field>

                {/* ── Emergency Contact ── */}
                <View style={s.sectionLabel}>
                    <Text style={s.sectionLabelText}>Emergency Contact</Text>
                </View>

                <Field label="Contact Name">
                    <TextInput
                        style={s.input}
                        value={emergencyName}
                        onChangeText={setEmergencyName}
                        placeholder="Parent, sibling, or trusted friend"
                        placeholderTextColor="#334155"
                        autoCapitalize="words"
                        returnKeyType="next"
                    />
                </Field>

                <Field label="Contact Phone Number">
                    <TextInput
                        style={s.input}
                        value={emergencyPhone}
                        onChangeText={setEmergencyPhone}
                        placeholder="+1 (555) 000-0000"
                        placeholderTextColor="#334155"
                        keyboardType="phone-pad"
                        returnKeyType="done"
                    />
                </Field>

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── Footer ── */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.btn, !canContinue && s.btnDisabled]}
                    onPress={handleContinue}
                    disabled={!canContinue || saving}
                    activeOpacity={0.85}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.btnText}>Save & Next →</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity style={s.skip} onPress={handleSkip}>
                    <Text style={s.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({
    label, hint, required, children,
}: {
    label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
    return (
        <View style={s.field}>
            <Text style={s.fieldLabel}>
                {label}
                {required && <Text style={s.required}> *</Text>}
            </Text>
            {hint && <Text style={s.fieldHint}>{hint}</Text>}
            {children}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0C1A2E' },

    progressBar: {
        height: 3, backgroundColor: '#0F2940',
    },
    progressFill: {
        height: '100%', backgroundColor: '#0891B2', borderRadius: 2,
    },

    scroll: { paddingHorizontal: 24, paddingBottom: 24 },

    header: { paddingTop: 48, paddingBottom: 28 },
    stepPill: {
        alignSelf: 'flex-start',
        backgroundColor: '#0F2940', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14,
        borderWidth: 1, borderColor: '#0891B220',
    },
    stepText: { color: '#0891B2', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    title: { fontSize: 26, fontWeight: '800', color: '#f8fafc', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#64748b', lineHeight: 21 },

    sectionLabel: {
        marginBottom: 8, marginTop: 4,
        borderLeftWidth: 3, borderLeftColor: '#0891B2', paddingLeft: 10,
    },
    sectionLabelText: {
        color: '#0891B2', fontSize: 13, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.5,
    },

    field: {
        backgroundColor: '#0F2940', borderRadius: 14, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#1E3A5F',
    },
    fieldLabel: {
        color: '#94a3b8', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
    },
    fieldHint: { color: '#475569', fontSize: 11, marginBottom: 6 },
    required: { color: '#0891B2' },

    input: {
        color: '#f8fafc', fontSize: 16, paddingVertical: 4,
    },

    footer: {
        padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1, borderTopColor: '#0F2940', gap: 12,
    },
    btn: {
        backgroundColor: '#0891B2', borderRadius: 14,
        paddingVertical: 16, alignItems: 'center',
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    skip: { alignItems: 'center', paddingVertical: 8 },
    skipText: { color: '#475569', fontSize: 15 },
});

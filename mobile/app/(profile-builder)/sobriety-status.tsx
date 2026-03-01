import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { SobrietyStatus } from '@shared/types/profile';

const STATUS_OPTIONS: { id: SobrietyStatus; label: string; emoji: string; description: string }[] = [
    {
        id: 'recovery',
        label: 'In Recovery',
        emoji: '🌱',
        description: 'I am not using and committed to my sobriety.',
    },
    {
        id: 'active_addiction',
        label: 'Active Addiction',
        emoji: '🔄',
        description: 'I am currently struggling with substance use.',
    },
    {
        id: 'detoxing',
        label: 'Currently Detoxing',
        emoji: '💊',
        description: 'I am in the process of detox right now.',
    },
];

const CLEAN_SINCE_OPTIONS = [
    { id: 'days_7', label: '< 1 week' },
    { id: 'days_30', label: '1–4 weeks' },
    { id: 'months_3', label: '1–3 months' },
    { id: 'months_6', label: '3–6 months' },
    { id: 'year_1', label: '6–12 months' },
    { id: 'years_2', label: '1–2 years' },
    { id: 'years_5', label: '2–5 years' },
    { id: 'years_5p', label: '5+ years' },
];

function durationToDate(id: string): string {
    const now = new Date();
    const map: Record<string, number> = {
        days_7: 7, days_30: 30, months_3: 90, months_6: 180,
        year_1: 365, years_2: 730, years_5: 1825, years_5p: 2190,
    };
    const days = map[id] ?? 0;
    now.setDate(now.getDate() - days);
    return now.toISOString();
}

export default function SobrietyStatusScreen() {
    const router = useRouter();
    const [status, setStatus] = useState<SobrietyStatus | null>(null);
    const [cleanDuration, setCleanDuration] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleContinue = async () => {
        setSaving(true);
        try {
            await userApi.updateMe({
                sobrietyStatus: status!,
                ...(status === 'recovery' && cleanDuration
                    ? { sobrietyCleanSince: durationToDate(cleanDuration) }
                    : {}),
            });
            router.push('/(profile-builder)/substances' as any);
        } finally {
            setSaving(false);
        }
    };

    const canContinue = status !== null && (status !== 'recovery' || cleanDuration !== null);

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.stepPill}><Text style={s.stepText}>Step 2 of 6</Text></View>
                <Text style={s.title}>Sobriety Status</Text>
                <Text style={s.subtitle}>This helps us personalise your experience.</Text>
            </View>

            <View style={s.body}>
                {STATUS_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[s.card, status === opt.id && s.cardSelected]}
                        onPress={() => { setStatus(opt.id); setCleanDuration(null); }}
                        activeOpacity={0.75}
                    >
                        <Text style={s.emoji}>{opt.emoji}</Text>
                        <View style={s.cardText}>
                            <Text style={[s.cardLabel, status === opt.id && s.cardLabelSelected]}>
                                {opt.label}
                            </Text>
                            <Text style={s.cardDesc}>{opt.description}</Text>
                        </View>
                        <View style={[s.radio, status === opt.id && s.radioSelected]}>
                            {status === opt.id && <View style={s.radioDot} />}
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Recovery follow-up: how long clean? */}
                {status === 'recovery' && (
                    <View style={s.followUp}>
                        <Text style={s.followUpTitle}>How long have you been clean?</Text>
                        <View style={s.durationGrid}>
                            {CLEAN_SINCE_OPTIONS.map(d => (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[s.durationChip, cleanDuration === d.id && s.durationChipSelected]}
                                    onPress={() => setCleanDuration(d.id)}
                                >
                                    <Text style={[s.durationText, cleanDuration === d.id && s.durationTextSelected]}>
                                        {d.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.btn, !canContinue && s.btnDisabled]}
                    onPress={handleContinue}
                    disabled={!canContinue || saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(profile-builder)/substances' as any)} style={s.skipBtn}>
                    <Text style={s.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 24 },
    stepPill: {
        alignSelf: 'flex-start', backgroundColor: '#1e293b',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12,
    },
    stepText: { color: '#64748b', fontSize: 12, fontFamily: 'Figtree-Bold', letterSpacing: 0.5 },
    title: { fontSize: 28, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 4 },
    subtitle: { fontSize: 15, color: '#94a3b8' },
    body: { flex: 1, paddingHorizontal: 24, gap: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1e293b', borderRadius: 16,
        padding: 16, borderWidth: 1.5, borderColor: '#334155',
    },
    cardSelected: { borderColor: '#10b981', backgroundColor: '#022c22' },
    emoji: { fontSize: 28, marginRight: 14 },
    cardText: { flex: 1 },
    cardLabel: { fontSize: 16, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 2 },
    cardLabelSelected: { color: '#6ee7b7' },
    cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#475569',
        justifyContent: 'center', alignItems: 'center',
    },
    radioSelected: { borderColor: '#10b981' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
    followUp: { marginTop: 8 },
    followUpTitle: { fontSize: 15, color: '#94a3b8', marginBottom: 12 },
    durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    durationChip: {
        borderWidth: 1.5, borderColor: '#334155', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1e293b',
    },
    durationChipSelected: { borderColor: '#10b981', backgroundColor: '#022c22' },
    durationText: { fontSize: 14, color: '#94a3b8' },
    durationTextSelected: { color: '#6ee7b7', fontFamily: 'Figtree-Bold' },
    footer: {
        padding: 24, paddingBottom: 44,
        borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12,
    },
    btn: {
        backgroundColor: '#6366f1', borderRadius: 14,
        paddingVertical: 16, alignItems: 'center',
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 17, fontFamily: 'Figtree-Bold' },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipText: { color: '#475569', fontSize: 15 },
});

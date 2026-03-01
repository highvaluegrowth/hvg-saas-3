import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { Religion, Denomination } from '@shared/types/profile';

// ─── Data ────────────────────────────────────────────────────────────────────

const RELIGIONS: { id: Religion; label: string }[] = [
    { id: 'christian', label: 'a Christian' },
    { id: 'muslim', label: 'a Muslim' },
    { id: 'buddhist', label: 'Buddhist' },
    { id: 'jewish', label: 'a Jew' },
    { id: 'hindu', label: 'Hindu' },
    { id: 'agnostic', label: 'Agnostic' },
    { id: 'atheist', label: 'an Atheist' },
];

const DENOMINATIONS: Record<Religion, { id: Denomination; label: string }[]> = {
    christian: [
        { id: 'catholic', label: 'Catholic' },
        { id: 'eastern_orthodox', label: 'Eastern Orthodox' },
        { id: 'oriental_orthodox', label: 'Oriental Orthodox' },
        { id: 'protestant', label: 'Protestant' },
        { id: 'lutheran', label: 'Lutheran' },
        { id: 'anglican', label: 'Anglican / Episcopalian' },
        { id: 'presbyterian', label: 'Presbyterian' },
        { id: 'methodist', label: 'Methodist' },
        { id: 'baptist', label: 'Baptist' },
        { id: 'anabaptism', label: 'Anabaptism' },
        { id: 'pentecostal', label: 'Pentecostal' },
        { id: 'restoration', label: 'Restoration' },
        { id: 'non_denominational', label: 'Non-denominational' },
        { id: 'other', label: 'Other' },
    ],
    jewish: [
        { id: 'messianic', label: 'Messianic' },
        { id: 'orthodox', label: 'Orthodox' },
        { id: 'conservative', label: 'Conservative' },
        { id: 'reform', label: 'Reform' },
        { id: 'deconstructionist', label: 'Deconstructionist' },
        { id: 'humanist', label: 'Humanist' },
        { id: 'non_denominational', label: 'Non-denominational' },
        { id: 'other', label: 'Other' },
    ],
    muslim: [
        { id: 'sunni', label: 'Sunni' },
        { id: 'shia', label: 'Shia' },
        { id: 'ibadi', label: 'Ibadi' },
        { id: 'non_denominational', label: 'Non-denominational' },
        { id: 'other', label: 'Other' },
    ],
    hindu: [
        { id: 'vaishnavism', label: 'Vaishnavism' },
        { id: 'shaivism', label: 'Shaivism' },
        { id: 'shaktism', label: 'Shaktism' },
        { id: 'smartism', label: 'Smartism' },
        { id: 'non_denominational', label: 'Non-denominational' },
        { id: 'other', label: 'Other' },
    ],
    buddhist: [
        { id: 'theravada', label: 'Theravada' },
        { id: 'mahayana', label: 'Mahayana' },
        { id: 'vajrayana', label: 'Vajrayana' },
        { id: 'non_denominational', label: 'Non-denominational' },
        { id: 'other', label: 'Other' },
    ],
    agnostic: [
        { id: 'strong_hard', label: 'Strong / Hard' },
        { id: 'weak_soft', label: 'Weak / Soft' },
        { id: 'atheism', label: 'Atheism' },
        { id: 'theism', label: 'Theism' },
        { id: 'apathetic_pragmatic', label: 'Apathetic / Pragmatic' },
        { id: 'ignosticism', label: 'Ignosticism / Theological' },
        { id: 'other', label: 'Other' },
    ],
    atheist: [
        { id: 'new_atheism', label: 'New Atheism' },
        { id: 'secular_humanism', label: 'Secular Humanism' },
        { id: 'science_as_religion', label: 'Science as Religion' },
        { id: 'political_religion', label: 'Political Religion' },
        { id: 'misotheism', label: 'Misotheism' },
        { id: 'without_progress', label: 'Atheism without Progress' },
        { id: 'mystical', label: 'Mystical' },
        { id: 'other', label: 'Other' },
    ],
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function FaithScreen() {
    const router = useRouter();
    const [religion, setReligion] = useState<Religion | null>(null);
    const [denomination, setDenomination] = useState<Denomination | null>(null);
    const [saving, setSaving] = useState(false);

    const handleReligion = useCallback((r: Religion) => {
        setReligion(r);
        setDenomination(null); // reset sub-choice
    }, []);

    const handleContinue = async () => {
        setSaving(true);
        try {
            await userApi.updateMe({
                faith: {
                    religion: religion!,
                    ...(denomination ? { denomination } : {}),
                },
            });
            router.push('/(profile-builder)/sobriety-status' as any);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => router.push('/(profile-builder)/sobriety-status' as any);

    const denomOptions = religion ? DENOMINATIONS[religion] : [];

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.stepPill}><Text style={s.stepText}>Step 1 of 6</Text></View>
                <Text style={s.title}>Faith & Beliefs</Text>
                <Text style={s.subtitle}>I am…</Text>
            </View>

            <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Religion picker */}
                {RELIGIONS.map(r => (
                    <TouchableOpacity
                        key={r.id}
                        style={[s.option, religion === r.id && s.optionSelected]}
                        onPress={() => handleReligion(r.id)}
                        activeOpacity={0.75}
                    >
                        <View style={[s.radio, religion === r.id && s.radioSelected]}>
                            {religion === r.id && <View style={s.radioDot} />}
                        </View>
                        <Text style={[s.optionText, religion === r.id && s.optionTextSelected]}>
                            {r.label}
                        </Text>
                    </TouchableOpacity>
                ))}

                {/* Denomination sub-picker */}
                {religion && denomOptions.length > 0 && (
                    <View style={s.sub}>
                        <Text style={s.subTitle}>
                            {religion === 'agnostic' ? 'Which kind?' :
                                religion === 'atheist' ? 'Which best describes you?' :
                                    'Which denomination?'}
                        </Text>
                        <View style={s.denomGrid}>
                            {denomOptions.map(d => (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[s.denomChip, denomination === d.id && s.denomChipSelected]}
                                    onPress={() => setDenomination(d.id)}
                                >
                                    <Text style={[s.denomText, denomination === d.id && s.denomTextSelected]}>
                                        {d.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer CTAs */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.btn, !religion && s.btnDisabled]}
                    onPress={handleContinue}
                    disabled={!religion || saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.btnText}>Continue</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
                    <Text style={s.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 20 },
    stepPill: {
        alignSelf: 'flex-start',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 12,
    },
    stepText: { color: '#64748b', fontSize: 12, fontFamily: 'Figtree-Bold', letterSpacing: 0.5 },
    title: { fontSize: 28, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#94a3b8' },
    scroll: { flex: 1, paddingHorizontal: 24 },
    scrollContent: { paddingTop: 8 },
    option: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1e293b', borderRadius: 14,
        padding: 16, marginBottom: 10,
        borderWidth: 1.5, borderColor: '#334155',
        minHeight: 56,
    },
    optionSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: '#475569',
        marginRight: 14, justifyContent: 'center', alignItems: 'center',
    },
    radioSelected: { borderColor: '#6366f1' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6366f1' },
    optionText: { flex: 1, fontSize: 16, color: '#cbd5e1', fontFamily: 'System' },
    optionTextSelected: { color: '#e0e7ff', fontFamily: 'Figtree-Bold' },
    sub: { marginTop: 8, marginBottom: 4 },
    subTitle: { fontSize: 14, color: '#64748b', marginBottom: 12, letterSpacing: 0.3 },
    denomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    denomChip: {
        borderWidth: 1.5, borderColor: '#334155',
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: '#1e293b',
    },
    denomChipSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    denomText: { fontSize: 14, color: '#94a3b8' },
    denomTextSelected: { color: '#e0e7ff', fontFamily: 'Figtree-Bold' },
    footer: {
        padding: 24, paddingBottom: 44,
        borderTopWidth: 1, borderTopColor: '#1e293b',
        backgroundColor: '#0f172a',
        gap: 12,
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

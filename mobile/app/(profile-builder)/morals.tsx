import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { MoralResponse, MoralQuestionType } from '@shared/types/profile';

// ─── Question Data ────────────────────────────────────────────────────────────

interface Question {
    id: string;
    type: MoralQuestionType;
    text: string;
    optionA?: string;
    optionB?: string;
    options?: string[];       // for two_options
}

const QUESTIONS: Question[] = [
    {
        id: 'trolley_1',
        type: 'trolley',
        text: 'A runaway trolley is heading toward five people. You can pull a lever to divert it, killing one person instead. Do you pull the lever?',
        optionA: 'Yes — pull the lever',
        optionB: 'No — do nothing',
    },
    {
        id: 'two_opt_1',
        type: 'two_options',
        text: 'Which do you value more?',
        options: ['Loyalty to family', 'Loyalty to principles'],
    },
    {
        id: 'likert_1',
        type: 'likert_7',
        text: 'People are fundamentally good at heart.',
    },
    {
        id: 'trolley_2',
        type: 'trolley',
        text: 'You discover a friend has committed a minor crime. Do you report them?',
        optionA: 'Yes — report them',
        optionB: 'No — stay loyal',
    },
    {
        id: 'likert_2',
        type: 'likert_7',
        text: 'I feel a personal responsibility to help those struggling with addiction.',
    },
];

const LIKERT_LABELS = ['Strongly\nDisagree', 'Disagree', 'Somewhat\nDisagree', 'Neutral', 'Somewhat\nAgree', 'Agree', 'Strongly\nAgree'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const TrolleyQuestion = React.memo(({ q, value, onAnswer }: { q: Question; value: string | undefined; onAnswer: (id: string, a: string) => void }) => (
    <View style={s.qCard}>
        <Text style={s.qText}>{q.text}</Text>
        <View style={s.trolleyRow}>
            <TouchableOpacity
                style={[s.trolleyBtn, value === 'A' && s.trolleyBtnSelected]}
                onPress={() => onAnswer(q.id, 'A')}
            >
                <Text style={[s.trolleyTxt, value === 'A' && s.trolleyTxtSelected]}>{q.optionA}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[s.trolleyBtn, s.trolleyBtnB, value === 'B' && s.trolleyBtnBSelected]}
                onPress={() => onAnswer(q.id, 'B')}
            >
                <Text style={[s.trolleyTxt, value === 'B' && s.trolleyTxtSelected]}>{q.optionB}</Text>
            </TouchableOpacity>
        </View>
    </View>
));

const TwoOptionQuestion = React.memo(({ q, value, onAnswer }: { q: Question; value: string | undefined; onAnswer: (id: string, a: string) => void }) => (
    <View style={s.qCard}>
        <Text style={s.qText}>{q.text}</Text>
        <View style={s.optionRow}>
            {q.options!.map((opt, i) => (
                <TouchableOpacity
                    key={i}
                    style={[s.option, value === opt && s.optionSelected]}
                    onPress={() => onAnswer(q.id, opt)}
                >
                    <Text style={[s.optionTxt, value === opt && s.optionTxtSelected]}>{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
));

const LikertQuestion = React.memo(({ q, value, onAnswer }: { q: Question; value: number | undefined; onAnswer: (id: string, a: number) => void }) => (
    <View style={s.qCard}>
        <Text style={s.qText}>{q.text}</Text>
        <View style={s.likertRow}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <TouchableOpacity
                    key={n}
                    style={[s.likertDot, value === n && s.likertDotSelected]}
                    onPress={() => onAnswer(q.id, n)}
                >
                    <Text style={[s.likertN, value === n && s.likertNSelected]}>{n}</Text>
                </TouchableOpacity>
            ))}
        </View>
        <View style={s.likertLabels}>
            <Text style={s.likertEdge}>Disagree</Text>
            <Text style={s.likertEdge}>Agree</Text>
        </View>
    </View>
));

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MoralsScreen() {
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, string | number>>({});
    const [saving, setSaving] = useState(false);

    const handleAnswer = useCallback((id: string, value: string | number) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    }, []);

    const answeredCount = Object.keys(answers).length;
    const total = QUESTIONS.length;

    const handleComplete = async () => {
        setSaving(true);
        try {
            const responses: MoralResponse[] = Object.entries(answers).map(([questionId, answer]) => {
                const q = QUESTIONS.find(x => x.id === questionId)!;
                return { questionId, type: q.type, answer, answeredAt: new Date().toISOString() };
            });
            await userApi.updateMe({ morals: responses, profileComplete: true });
            router.replace('/(tabs)');
        } finally { setSaving(false); }
    };

    const handleSkip = async () => {
        setSaving(true);
        try {
            await userApi.updateMe({ profileComplete: true });
            router.replace('/(tabs)');
        } finally { setSaving(false); }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.stepPill}><Text style={s.stepText}>Step 6 of 6</Text></View>
                <Text style={s.title}>Morals & Values</Text>
                <Text style={s.subtitle}>
                    Answer at your own pace. You'll get 5 new questions each week to help us understand who you are over time.
                </Text>
                <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${(answeredCount / total) * 100}%` }]} />
                </View>
                <Text style={s.progressTxt}>{answeredCount} / {total} answered</Text>
            </View>

            <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {QUESTIONS.map(q => {
                    if (q.type === 'trolley') return (
                        <TrolleyQuestion key={q.id} q={q} value={answers[q.id] as string} onAnswer={handleAnswer} />
                    );
                    if (q.type === 'two_options') return (
                        <TwoOptionQuestion key={q.id} q={q} value={answers[q.id] as string} onAnswer={handleAnswer} />
                    );
                    return (
                        <LikertQuestion key={q.id} q={q} value={answers[q.id] as number} onAnswer={handleAnswer} />
                    );
                })}
                <View style={{ height: 24 }} />
            </ScrollView>

            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.btn, saving && s.btnDis]}
                    onPress={handleComplete}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Complete Profile 🎉</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkip} style={s.skip} disabled={saving}>
                    <Text style={s.skipTxt}>Skip — I'll answer later</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
    stepPill: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
    stepText: { color: '#64748b', fontSize: 12, fontFamily: 'Figtree-Bold', letterSpacing: 0.5 },
    title: { fontSize: 26, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 16 },
    progressBar: { height: 4, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
    progressTxt: { fontSize: 12, color: '#475569', marginTop: 6 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24 },

    // Cards
    qCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
    qText: { fontSize: 15, color: '#e2e8f0', lineHeight: 22, marginBottom: 16, fontFamily: 'System' },

    // Trolley
    trolleyRow: { gap: 10 },
    trolleyBtn: {
        paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: 12, borderWidth: 1.5, borderColor: '#334155',
        backgroundColor: '#0f172a', alignItems: 'center',
    },
    trolleyBtnSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    trolleyBtnB: { borderColor: '#334155' },
    trolleyBtnBSelected: { borderColor: '#ef4444', backgroundColor: '#2c0a0a' },
    trolleyTxt: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
    trolleyTxtSelected: { color: '#fff', fontFamily: 'Figtree-Bold' },

    // Two options
    optionRow: { flexDirection: 'row', gap: 10 },
    option: {
        flex: 1, paddingVertical: 14, paddingHorizontal: 10,
        borderRadius: 12, borderWidth: 1.5, borderColor: '#334155',
        backgroundColor: '#0f172a', alignItems: 'center',
    },
    optionSelected: { borderColor: '#10b981', backgroundColor: '#022c22' },
    optionTxt: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
    optionTxtSelected: { color: '#6ee7b7', fontFamily: 'Figtree-Bold' },

    // Likert
    likertRow: { flexDirection: 'row', justifyContent: 'space-between' },
    likertDot: {
        width: 40, height: 40, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#334155',
        backgroundColor: '#0f172a',
        justifyContent: 'center', alignItems: 'center',
    },
    likertDotSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    likertN: { fontSize: 13, color: '#64748b' },
    likertNSelected: { color: '#e0e7ff', fontFamily: 'Figtree-Bold' },
    likertLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    likertEdge: { fontSize: 11, color: '#475569' },

    // Footer
    footer: { padding: 24, paddingBottom: 44, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12 },
    btn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    btnDis: { opacity: 0.6 },
    btnTxt: { color: '#fff', fontSize: 17, fontFamily: 'Figtree-Bold' },
    skip: { alignItems: 'center', paddingVertical: 8 },
    skipTxt: { color: '#475569', fontSize: 15 },
});

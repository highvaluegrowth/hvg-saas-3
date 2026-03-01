import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, Modal, TextInput, ActivityIndicator,
    ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { Goal, GoalCategory } from '@shared/types/profile';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CATEGORIES: { id: GoalCategory; label: string; emoji: string; color: string }[] = [
    { id: 'recovery', label: 'Recovery', emoji: '🌿', color: '#10b981' },
    { id: 'fitness', label: 'Fitness', emoji: '💪', color: '#f59e0b' },
    { id: 'professional', label: 'Career', emoji: '💼', color: '#3b82f6' },
    { id: 'personal', label: 'Personal', emoji: '⭐', color: '#8b5cf6' },
];

const SMART = [
    { key: 'specific', label: 'Specific', hint: 'I will…', icon: '🎯' },
    { key: 'measurable', label: 'Measurable', hint: 'I will measure this by…', icon: '📏' },
    { key: 'achievable', label: 'Achievable', hint: 'I can do this because…', icon: '🪜' },
    { key: 'relevant', label: 'Relevant', hint: 'This matters to me because…', icon: '❤️' },
    { key: 'timeBound', label: 'Time-bound', hint: 'I will complete this by…', icon: '📅' },
] as const;

const GoalCard = React.memo(({ item, onDelete }: { item: Goal; onDelete: (id: string) => void }) => {
    const cat = CATEGORIES.find(c => c.id === item.category)!;
    return (
        <View style={s.card}>
            <View style={[s.catBadge, { backgroundColor: cat.color + '22', borderColor: cat.color }]}>
                <Text style={[s.catText, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
            </View>
            <Text style={s.goalTitle}>{item.specific}</Text>
            <Text style={s.goalSub}>{item.measurable}</Text>
            <TouchableOpacity onPress={() => onDelete(item.id)} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );
});

export default function GoalsScreen() {
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [category, setCategory] = useState<GoalCategory>('recovery');
    const [specific, setSpecific] = useState('');
    const [measurable, setMeasurable] = useState('');
    const [achievable, setAchievable] = useState('');
    const [relevant, setRelevant] = useState('');
    const [timeBound, setTimeBound] = useState('');

    const setters: Record<string, (v: string) => void> = {
        specific: setSpecific, measurable: setMeasurable,
        achievable: setAchievable, relevant: setRelevant, timeBound: setTimeBound,
    };
    const values: Record<string, string> = {
        specific, measurable, achievable, relevant, timeBound,
    };

    const resetForm = () => {
        setSpecific(''); setMeasurable(''); setAchievable(''); setRelevant(''); setTimeBound('');
        setCategory('recovery');
    };

    const handleAdd = () => {
        if (!specific.trim() || !measurable.trim()) return;
        const goal: Goal = {
            id: String(Date.now()), category, specific, measurable,
            achievable, relevant, timeBound,
            createdAt: new Date().toISOString(),
        };
        setGoals(prev => [...prev, goal]);
        resetForm();
        setModal(false);
    };

    const handleDelete = useCallback((id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    }, []);

    const renderItem = useCallback(
        ({ item }: { item: Goal }) => <GoalCard item={item} onDelete={handleDelete} />,
        [handleDelete]
    );
    const keyExtractor = useCallback((g: Goal) => g.id, []);

    const handleContinue = async () => {
        setSaving(true);
        try {
            await userApi.updateMe({ goals });
            router.push('/(profile-builder)/morals' as any);
        } finally { setSaving(false); }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.stepPill}><Text style={s.stepText}>Step 5 of 6</Text></View>
                <Text style={s.title}>Goals</Text>
                <Text style={s.subtitle}>Goals are just as important as staying clean. Build yours using the SMART framework.</Text>
            </View>

            <FlatList
                data={goals}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={s.list}
                ListEmptyComponent={<Text style={s.emptyTxt}>No goals yet. Add your first goal below.</Text>}
                ListFooterComponent={
                    <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
                        <MaterialIcons name="add-circle-outline" size={18} color="#6366f1" />
                        <Text style={s.addBtnTxt}>Add Goal</Text>
                    </TouchableOpacity>
                }
            />

            <View style={s.footer}>
                <TouchableOpacity style={[s.btn, saving && s.btnDis]} onPress={handleContinue} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Continue</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(profile-builder)/morals' as any)} style={s.skip}>
                    <Text style={s.skipTxt}>Skip for now</Text>
                </TouchableOpacity>
            </View>

            {/* SMART Goal Modal */}
            <Modal visible={modal} animationType="slide" transparent presentationStyle="overFullScreen">
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={s.overlay}>
                        <View style={s.sheet}>
                            <Text style={s.modalTitle}>New Goal</Text>

                            {/* Category */}
                            <Text style={s.fieldLabel}>Category</Text>
                            <View style={s.catRow}>
                                {CATEGORIES.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[s.catChip, category === c.id && { borderColor: c.color, backgroundColor: c.color + '22' }]}
                                        onPress={() => setCategory(c.id)}
                                    >
                                        <Text style={[s.catChipTxt, category === c.id && { color: c.color }]}>
                                            {c.emoji} {c.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* SMART fields */}
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {SMART.map(({ key, label, hint, icon }) => (
                                    <View key={key} style={s.smartField}>
                                        <Text style={s.smartLabel}>{icon} {label}</Text>
                                        <TextInput
                                            value={values[key]}
                                            onChangeText={setters[key]}
                                            placeholder={hint}
                                            placeholderTextColor="#475569"
                                            style={s.input}
                                            multiline={key === 'specific' || key === 'relevant'}
                                        />
                                    </View>
                                ))}
                                <View style={{ height: 12 }} />
                            </ScrollView>

                            <View style={s.modalActions}>
                                <TouchableOpacity onPress={() => { resetForm(); setModal(false); }} style={s.cancelBtn}>
                                    <Text style={s.cancelTxt}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAdd} style={[s.confirmBtn, (!specific.trim() || !measurable.trim()) && { opacity: 0.4 }]}>
                                    <Text style={s.confirmTxt}>Add Goal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
    stepPill: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
    stepText: { color: '#64748b', fontSize: 12, fontFamily: 'Figtree-Bold', letterSpacing: 0.5 },
    title: { fontSize: 26, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20 },
    list: { paddingHorizontal: 24, paddingBottom: 24 },
    card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    catBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
    catText: { fontSize: 12, fontFamily: 'Figtree-Bold' },
    goalTitle: { fontSize: 15, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 4 },
    goalSub: { fontSize: 13, color: '#64748b' },
    deleteBtn: { position: 'absolute', top: 12, right: 12 },
    emptyTxt: { color: '#334155', textAlign: 'center', paddingVertical: 24, fontSize: 14 },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 14 },
    addBtnTxt: { color: '#6366f1', fontSize: 15, fontFamily: 'Figtree-Bold' },
    footer: { padding: 24, paddingBottom: 44, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12 },
    btn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    btnDis: { opacity: 0.6 },
    btnTxt: { color: '#fff', fontSize: 17, fontFamily: 'Figtree-Bold' },
    skip: { alignItems: 'center', paddingVertical: 8 },
    skipTxt: { color: '#475569', fontSize: 15 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 16 },
    fieldLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    catChip: { borderWidth: 1.5, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#0f172a' },
    catChipTxt: { fontSize: 13, color: '#94a3b8' },
    smartField: { marginBottom: 14 },
    smartLabel: { fontSize: 13, fontFamily: 'Figtree-Bold', color: '#94a3b8', marginBottom: 6 },
    input: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f8fafc', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    cancelTxt: { color: '#94a3b8', fontSize: 15 },
    confirmBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    confirmTxt: { color: '#fff', fontSize: 15, fontFamily: 'Figtree-Bold' },
});

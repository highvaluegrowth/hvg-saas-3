import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, Modal, ActivityIndicator, Alert,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { SubstanceEntry, Substance } from '@shared/types/profile';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const SUBSTANCES: { id: Substance; label: string }[] = [
    { id: 'amphetamine', label: 'Amphetamine' },
    { id: 'barbiturates', label: 'Barbiturates' },
    { id: 'benzodiazepines', label: 'Benzodiazepines' },
    { id: 'cannabis', label: 'Cannabis' },
    { id: 'cocaine', label: 'Cocaine' },
    { id: 'fentanyl', label: 'Fentanyl' },
    { id: 'ghb', label: 'GHB' },
    { id: 'heroin', label: 'Heroin' },
    { id: 'hydrocodone', label: 'Hydrocodone' },
    { id: 'ketamine', label: 'Ketamine' },
    { id: 'lsd', label: 'LSD' },
    { id: 'mescaline', label: 'Mescaline' },
    { id: 'methamphetamine', label: 'Methamphetamine' },
    { id: 'mdma', label: 'MDMA' },
    { id: 'oxycodone', label: 'Oxycodone' },
    { id: 'pcp', label: 'PCP' },
    { id: 'synthetic_cannabinoids', label: 'Synthetic Cannabinoids' },
    { id: 'synthetic_cathinones', label: 'Synthetic Cathinones' },
];

const MONTHS = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, '0')
);
const YEARS = Array.from({ length: 40 }, (_, i) =>
    String(new Date().getFullYear() - i)
);

// ─── Sub-components (memoized) ───────────────────────────────────────────────

const SubstanceRow = React.memo(({ item, onDelete }: { item: SubstanceEntry; onDelete: (id: string) => void }) => (
    <View style={s.row}>
        <View style={s.rowInfo}>
            <Text style={s.rowLabel}>
                {SUBSTANCES.find(x => x.id === item.substance)?.label ?? item.substance}
            </Text>
            <Text style={s.rowMeta}>Since {item.startDate}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
    </View>
));

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SubstancesScreen() {
    const router = useRouter();
    const [items, setItems] = useState<SubstanceEntry[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [pickedSubstance, setPickedSubstance] = useState<Substance | null>(null);
    const [pickedMonth, setPickedMonth] = useState('01');
    const [pickedYear, setPickedYear] = useState(String(new Date().getFullYear()));
    const [saving, setSaving] = useState(false);

    const handleDelete = useCallback((id: string) => {
        setItems(prev => prev.filter(x => x.id !== id));
    }, []);

    const handleAdd = () => {
        if (!pickedSubstance) {
            Alert.alert('Please select a substance.');
            return;
        }
        const entry: SubstanceEntry = {
            id: `${Date.now()}`,
            substance: pickedSubstance,
            startDate: `${pickedMonth}/${pickedYear}`,
        };
        setItems(prev => [...prev, entry]);
        setModalOpen(false);
        setPickedSubstance(null);
    };

    const handleContinue = async () => {
        setSaving(true);
        try {
            await userApi.updateMe({ substances: items });
            router.push('/(profile-builder)/capabilities' as any);
        } finally {
            setSaving(false);
        }
    };

    const renderItem = useCallback(
        ({ item }: { item: SubstanceEntry }) => <SubstanceRow item={item} onDelete={handleDelete} />,
        [handleDelete]
    );
    const keyExtractor = useCallback((item: SubstanceEntry) => item.id, []);

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.stepPill}><Text style={s.stepText}>Step 3 of 6</Text></View>
                <Text style={s.title}>Substance Abuse & Sobriety</Text>
                <Text style={s.subtitle}>
                    This is not just a history of drug use. Add the substance(s) you consider yourself to be in recovery from.
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={s.listContent}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyText}>No substances added yet.</Text>
                    </View>
                }
                ListFooterComponent={
                    <TouchableOpacity style={s.addBtn} onPress={() => setModalOpen(true)}>
                        <MaterialIcons name="add-circle-outline" size={20} color="#6366f1" />
                        <Text style={s.addBtnText}>Add Substance</Text>
                    </TouchableOpacity>
                }
            />

            {/* Footer */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.btn, saving && s.btnDisabled]}
                    onPress={handleContinue}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(profile-builder)/capabilities' as any)} style={s.skipBtn}>
                    <Text style={s.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>

            {/* Add Substance Modal */}
            <Modal visible={modalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <Text style={s.modalTitle}>Add Substance</Text>

                        <Text style={s.label}>Substance</Text>
                        <ScrollView style={s.substanceScroll} showsVerticalScrollIndicator={false}>
                            <View style={s.substanceGrid}>
                                {SUBSTANCES.map(sub => (
                                    <TouchableOpacity
                                        key={sub.id}
                                        style={[s.substanceChip, pickedSubstance === sub.id && s.substanceChipSelected]}
                                        onPress={() => setPickedSubstance(sub.id)}
                                    >
                                        <Text style={[s.substanceChipText, pickedSubstance === sub.id && s.substanceChipTextSelected]}>
                                            {sub.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={s.label}>Started (Month / Year)</Text>
                        <View style={s.dateRow}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateScroll}>
                                {MONTHS.map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[s.dateChip, pickedMonth === m && s.dateChipSelected]}
                                        onPress={() => setPickedMonth(m)}
                                    >
                                        <Text style={[s.dateChipText, pickedMonth === m && s.dateChipTextSelected]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <View style={s.dateRow}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dateScroll}>
                                {YEARS.map(y => (
                                    <TouchableOpacity
                                        key={y}
                                        style={[s.dateChip, pickedYear === y && s.dateChipSelected]}
                                        onPress={() => setPickedYear(y)}
                                    >
                                        <Text style={[s.dateChipText, pickedYear === y && s.dateChipTextSelected]}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={s.modalActions}>
                            <TouchableOpacity onPress={() => setModalOpen(false)} style={s.modalCancel}>
                                <Text style={s.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAdd} style={s.modalConfirm}>
                                <Text style={s.modalConfirmText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
    stepPill: {
        alignSelf: 'flex-start', backgroundColor: '#1e293b',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12,
    },
    stepText: { color: '#64748b', fontSize: 12, fontFamily: 'Figtree-Bold', letterSpacing: 0.5 },
    title: { fontSize: 26, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20 },
    listContent: { paddingHorizontal: 24, paddingBottom: 24 },
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1e293b', borderRadius: 12,
        padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#334155',
    },
    rowInfo: { flex: 1 },
    rowLabel: { fontSize: 15, fontFamily: 'Figtree-Bold', color: '#f8fafc' },
    rowMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
    deleteBtn: { padding: 4 },
    empty: { alignItems: 'center', paddingVertical: 32 },
    emptyText: { color: '#334155', fontSize: 14 },
    addBtn: {
        flexDirection: 'row', alignItems: 'center',
        gap: 8, paddingVertical: 14, justifyContent: 'center',
    },
    addBtnText: { color: '#6366f1', fontSize: 15, fontFamily: 'Figtree-Bold' },
    footer: { padding: 24, paddingBottom: 44, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 12 },
    btn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 17, fontFamily: 'Figtree-Bold' },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipText: { color: '#475569', fontSize: 15 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, maxHeight: '80%',
    },
    modalTitle: { fontSize: 20, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 20 },
    label: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    substanceScroll: { maxHeight: 160, marginBottom: 16 },
    substanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    substanceChip: {
        borderWidth: 1.5, borderColor: '#334155', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#0f172a',
    },
    substanceChipSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    substanceChipText: { fontSize: 13, color: '#94a3b8' },
    substanceChipTextSelected: { color: '#e0e7ff', fontFamily: 'Figtree-Bold' },
    dateRow: { marginBottom: 12 },
    dateScroll: {},
    dateChip: {
        borderWidth: 1.5, borderColor: '#334155', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#0f172a', marginRight: 8,
    },
    dateChipSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    dateChipText: { fontSize: 13, color: '#94a3b8' },
    dateChipTextSelected: { color: '#e0e7ff', fontFamily: 'Figtree-Bold' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    modalCancel: {
        flex: 1, borderWidth: 1, borderColor: '#334155',
        borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    },
    modalCancelText: { color: '#94a3b8', fontSize: 15 },
    modalConfirm: {
        flex: 1, backgroundColor: '#6366f1',
        borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    },
    modalConfirmText: { color: '#fff', fontSize: 15, fontFamily: 'Figtree-Bold' },
});

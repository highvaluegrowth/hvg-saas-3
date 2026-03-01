import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, Modal, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import type { Capabilities, SkillEntry, WorkEntry, EducationEntry, SkillLevel } from '@shared/types/profile';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Section = 'skills' | 'work' | 'education';

const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'expert', label: 'Expert' },
];
const YEARS_OPTS = Array.from({ length: 41 }, (_, i) => i);   // 0-40
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

// ─── Shared Input ─────────────────────────────────────────────────────────────
const Field = ({ label, value, onChangeText, placeholder }: any) => (
    <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <TextInput
            value={value} onChangeText={onChangeText}
            placeholder={placeholder} placeholderTextColor="#475569"
            style={s.input}
        />
    </View>
);

// ─── Date picker row ─────────────────────────────────────────────────────────
const DateChips = ({ label, month, year, onMonth, onYear, allowPresent, isPresent, onPresent }: any) => (
    <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
            {MONTHS.map(m => (
                <TouchableOpacity key={m} style={[s.chip, month === m && s.chipSel]} onPress={() => onMonth(m)}>
                    <Text style={[s.chipTxt, month === m && s.chipTxtSel]}>{m}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {YEARS.map(y => (
                <TouchableOpacity key={y} style={[s.chip, year === y && s.chipSel]} onPress={() => onYear(y)}>
                    <Text style={[s.chipTxt, year === y && s.chipTxtSel]}>{y}</Text>
                </TouchableOpacity>
            ))}
            {allowPresent && (
                <TouchableOpacity style={[s.chip, isPresent && s.chipSel]} onPress={onPresent}>
                    <Text style={[s.chipTxt, isPresent && s.chipTxtSel]}>Present</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    </View>
);

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function CapabilitiesScreen() {
    const router = useRouter();
    const [section, setSection] = useState<Section>('skills');
    const [skills, setSkills] = useState<SkillEntry[]>([]);
    const [work, setWork] = useState<WorkEntry[]>([]);
    const [education, setEducation] = useState<EducationEntry[]>([]);
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Skill form state
    const [skDesc, setSkDesc] = useState('');
    const [skLevel, setSkLevel] = useState<SkillLevel>('beginner');
    const [skYears, setSkYears] = useState(0);

    // Work form state
    const [wkCompany, setWkCompany] = useState('');
    const [wkPosition, setWkPosition] = useState('');
    const [wkStartM, setWkStartM] = useState('01');
    const [wkStartY, setWkStartY] = useState(String(new Date().getFullYear()));
    const [wkEndM, setWkEndM] = useState('01');
    const [wkEndY, setWkEndY] = useState(String(new Date().getFullYear()));
    const [wkPresent, setWkPresent] = useState(false);

    // Education form state
    const [edInst, setEdInst] = useState('');
    const [edFocus, setEdFocus] = useState('');
    const [edStartM, setEdStartM] = useState('01');
    const [edStartY, setEdStartY] = useState(String(new Date().getFullYear()));
    const [edEndM, setEdEndM] = useState('01');
    const [edEndY, setEdEndY] = useState(String(new Date().getFullYear()));
    const [edPresent, setEdPresent] = useState(false);

    const resetForms = () => {
        setSkDesc(''); setSkLevel('beginner'); setSkYears(0);
        setWkCompany(''); setWkPosition(''); setWkPresent(false);
        setEdInst(''); setEdFocus(''); setEdPresent(false);
    };

    const handleAdd = () => {
        const id = String(Date.now());
        if (section === 'skills' && skDesc.trim()) {
            setSkills(prev => [...prev, { id, description: skDesc.trim(), level: skLevel, yearsPracticed: skYears }]);
        } else if (section === 'work' && wkCompany.trim() && wkPosition.trim()) {
            setWork(prev => [...prev, {
                id, company: wkCompany.trim(), position: wkPosition.trim(),
                start: `${wkStartM}/${wkStartY}`,
                end: wkPresent ? undefined : `${wkEndM}/${wkEndY}`
            }]);
        } else if (section === 'education' && edInst.trim()) {
            setEducation(prev => [...prev, {
                id, institution: edInst.trim(), focus: edFocus.trim(),
                start: `${edStartM}/${edStartY}`,
                end: edPresent ? undefined : `${edEndM}/${edEndY}`
            }]);
        }
        resetForms();
        setModal(false);
    };

    const handleContinue = async () => {
        setSaving(true);
        try {
            const cap: Capabilities = { skills, workExperience: work, education };
            await userApi.updateMe({ capabilities: cap });
            router.push('/(profile-builder)/goals' as any);
        } finally { setSaving(false); }
    };

    const sections: Section[] = ['skills', 'work', 'education'];
    const SECTION_LABELS: Record<Section, string> = { skills: 'Skills', work: 'Work', education: 'Education' };

    const currentList = section === 'skills' ? skills : section === 'work' ? work : education;

    return (
        <View style={s.container}>
            <View style={s.header}>
                <View style={s.stepPill}><Text style={s.stepText}>Step 4 of 6</Text></View>
                <Text style={s.title}>Capabilities & Abilities</Text>
            </View>

            {/* Section tabs */}
            <View style={s.tabs}>
                {sections.map(sec => (
                    <TouchableOpacity key={sec} style={[s.tab, section === sec && s.tabActive]} onPress={() => setSection(sec)}>
                        <Text style={[s.tabText, section === sec && s.tabTextActive]}>{SECTION_LABELS[sec]}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={currentList as any[]}
                keyExtractor={item => item.id}
                contentContainerStyle={s.list}
                renderItem={({ item }) => (
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowTitle}>
                                {section === 'skills' ? item.description :
                                    section === 'work' ? item.position :
                                        item.institution}
                            </Text>
                            <Text style={s.rowSub}>
                                {section === 'skills' ? `${item.level} · ${item.yearsPracticed} yr${item.yearsPracticed !== 1 ? 's' : ''}` :
                                    section === 'work' ? `${item.company} · ${item.start} – ${item.end ?? 'Present'}` :
                                        `${item.focus} · ${item.start} – ${item.end ?? 'Present'}`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                if (section === 'skills') setSkills(prev => prev.filter(x => x.id !== item.id));
                                else if (section === 'work') setWork(prev => prev.filter(x => x.id !== item.id));
                                else setEducation(prev => prev.filter(x => x.id !== item.id));
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={s.emptyTxt}>Nothing added yet.</Text>}
                ListFooterComponent={
                    <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
                        <MaterialIcons name="add-circle-outline" size={18} color="#6366f1" />
                        <Text style={s.addBtnTxt}>Add {SECTION_LABELS[section]}</Text>
                    </TouchableOpacity>
                }
            />

            <View style={s.footer}>
                <TouchableOpacity style={[s.btn, saving && s.btnDis]} onPress={handleContinue} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Continue</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/(profile-builder)/goals' as any)} style={s.skip}>
                    <Text style={s.skipTxt}>Skip for now</Text>
                </TouchableOpacity>
            </View>

            {/* Add Modal */}
            <Modal visible={modal} animationType="slide" transparent presentationStyle="overFullScreen">
                <View style={s.overlay}>
                    <View style={s.sheet}>
                        <Text style={s.modalTitle}>Add {SECTION_LABELS[section]}</Text>
                        <ScrollView>
                            {section === 'skills' && <>
                                <Field label="Description / Name" value={skDesc} onChangeText={setSkDesc} placeholder="e.g. Carpentry, Meditation…" />
                                <Text style={s.fieldLabel}>Level</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    {SKILL_LEVELS.map(l => (
                                        <TouchableOpacity key={l.id} style={[s.chip, skLevel === l.id && s.chipSel]} onPress={() => setSkLevel(l.id)}>
                                            <Text style={[s.chipTxt, skLevel === l.id && s.chipTxtSel]}>{l.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={s.fieldLabel}>Years Practiced</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {YEARS_OPTS.map(y => (
                                        <TouchableOpacity key={y} style={[s.chip, skYears === y && s.chipSel]} onPress={() => setSkYears(y)}>
                                            <Text style={[s.chipTxt, skYears === y && s.chipTxtSel]}>{y}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>}

                            {section === 'work' && <>
                                <Field label="Company" value={wkCompany} onChangeText={setWkCompany} placeholder="Company name" />
                                <Field label="Position" value={wkPosition} onChangeText={setWkPosition} placeholder="Job title" />
                                <DateChips label="Start" month={wkStartM} year={wkStartY} onMonth={setWkStartM} onYear={setWkStartY} />
                                <DateChips label="End" month={wkEndM} year={wkEndY} onMonth={setWkEndM} onYear={setWkEndY}
                                    allowPresent isPresent={wkPresent} onPresent={() => setWkPresent(p => !p)} />
                            </>}

                            {section === 'education' && <>
                                <Field label="Institution" value={edInst} onChangeText={setEdInst} placeholder="School / University" />
                                <Field label="Focus / Major" value={edFocus} onChangeText={setEdFocus} placeholder="e.g. Computer Science" />
                                <DateChips label="Start" month={edStartM} year={edStartY} onMonth={setEdStartM} onYear={setEdStartY} />
                                <DateChips label="End" month={edEndM} year={edEndY} onMonth={setEdEndM} onYear={setEdEndY}
                                    allowPresent isPresent={edPresent} onPresent={() => setEdPresent(p => !p)} />
                            </>}
                        </ScrollView>

                        <View style={s.modalActions}>
                            <TouchableOpacity onPress={() => setModal(false)} style={s.cancelBtn}>
                                <Text style={s.cancelTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAdd} style={s.confirmBtn}>
                                <Text style={s.confirmTxt}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 12 },
    stepPill: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
    stepText: { color: '#64748b', fontSize: 12, fontFamily: 'Figtree-Bold', letterSpacing: 0.5 },
    title: { fontSize: 26, fontFamily: 'Figtree-Bold', color: '#f8fafc' },
    tabs: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 8 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#1e293b' },
    tabActive: { backgroundColor: '#6366f1' },
    tabText: { color: '#64748b', fontSize: 13, fontFamily: 'Figtree-Bold' },
    tabTextActive: { color: '#fff' },
    list: { paddingHorizontal: 24, paddingBottom: 24 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    rowTitle: { fontSize: 15, fontFamily: 'Figtree-Bold', color: '#f8fafc' },
    rowSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
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
    sheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalTitle: { fontSize: 20, fontFamily: 'Figtree-Bold', color: '#f8fafc', marginBottom: 20 },
    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    input: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f8fafc', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
    chip: { borderWidth: 1.5, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#0f172a', marginRight: 6 },
    chipSel: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
    chipTxt: { fontSize: 13, color: '#94a3b8' },
    chipTxtSel: { color: '#e0e7ff', fontFamily: 'Figtree-Bold' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    cancelTxt: { color: '#94a3b8', fontSize: 15 },
    confirmBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    confirmTxt: { color: '#fff', fontSize: 15, fontFamily: 'Figtree-Bold' },
});

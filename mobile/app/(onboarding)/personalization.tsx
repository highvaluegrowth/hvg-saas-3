import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '@/lib/api/routes';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const OPTIONS = [
    { id: 'support_recovery', label: 'I want support through my recovery.' },
    { id: 'live_sober_house', label: 'I want to live in a sober-living house.' },
    { id: 'attend_events', label: 'I want to attend meetings, classes, and other sober events.' },
    { id: 'take_courses', label: 'I want to sign up for and complete recovery courses.' },
    { id: 'host_events', label: 'I want to host meetings, classes, and other sober events.' },
    { id: 'manage_house', label: 'I want a platform to manage my sober-living house(s).' },
    { id: 'create_courses', label: 'I want to create courses for others in recovery.' },
    { id: 'help_others', label: 'I want to help people in recovery.' },
    { id: 'donate_money', label: 'I want to help people in recovery by donating money.' }
];

export default function PersonalizationScreen() {
    const router = useRouter();
    const { refreshAppUser } = useAuth();

    const [selected, setSelected] = useState<Set<string>>(new Set(['support_recovery']));
    const [loading, setLoading] = useState(false);

    const toggleOption = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
    };

    const handleContinue = async () => {
        if (selected.size === 0) {
            Alert.alert('Please select at least one option.');
            return;
        }

        try {
            setLoading(true);
            const preferences = Array.from(selected);

            // 1. Update user profile
            await userApi.updateMe({ preferences });

            // 2. Check if they want to manage a house -> Scaffold draft tenant application
            if (preferences.includes('manage_house')) {
                try {
                    const res = await api.post<{ applicationId: string }>('/api/mobile/tenants/application', {});
                    Alert.alert(
                        'Tenant Application Created',
                        `Your application has been drafted.\n\nPlease complete it on your computer at:\nhttps://highvaluegrowth.com/apply/${res.applicationId}`,
                        [{
                            text: 'Continue to Dashboard', onPress: async () => {
                                await refreshAppUser();
                                router.replace('/(tabs)');
                            }
                        }]
                    );
                    return;
                } catch (err: unknown) {
                    Alert.alert('Error drafting application', (err as Error).message);
                }
            }

            await refreshAppUser();
            router.replace('/(tabs)');
        } catch (err: unknown) {
            Alert.alert('Error saving preferences', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Personalize your HVG experience</Text>
            <Text style={styles.subtitle}>Check all that apply to help us tailor the platform to your needs.</Text>

            <ScrollView style={styles.list}>
                {OPTIONS.map(opt => {
                    const isSelected = selected.has(opt.id);
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                            onPress={() => toggleOption(opt.id)}
                        >
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
                            </View>
                            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Continue</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Figtree-Bold',
        color: '#fff',
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    list: {
        flex: 1,
        paddingHorizontal: 24,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    optionCardSelected: {
        backgroundColor: '#064e3b',
        borderColor: '#10b981',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#64748b',
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#f8fafc',
        lineHeight: 22,
    },
    optionTextSelected: {
        color: '#fff',
        fontFamily: 'System', // Use default font family slightly bolder maybe later
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#0f172a',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    button: {
        backgroundColor: '#0ea5e9',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Figtree-Bold',
    },
});

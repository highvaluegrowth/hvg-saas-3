import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api/client';

export default function HouseDetailsScreen() {
    const router = useRouter();
    const { houseId, tenantId } = useLocalSearchParams<{ houseId: string; tenantId: string }>();
    const [house, setHouse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHouse() {
            try {
                const res = await api.get(`/api/mobile/houses/${houseId}?tenantId=${tenantId}`);
                setHouse(res.house);
            } catch (error) {
                console.warn('Failed to fetch house:', error);
            } finally {
                setLoading(false);
            }
        }
        if (houseId && tenantId) {
            fetchHouse();
        } else {
            setLoading(false);
        }
    }, [houseId, tenantId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0891B2" />
                </View>
            </SafeAreaView>
        );
    }

    if (!house) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Program not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{house.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Cover Image Placeholder */}
                <View style={styles.imagePlaceholder}>
                    <Ionicons name="home" size={64} color="#334155" />
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.houseName}>{house.name}</Text>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={16} color="#0891B2" />
                        <Text style={styles.addressText}>
                            {house.address}, {house.city}, {house.state} {house.zipCode}
                        </Text>
                    </View>

                    <Text style={styles.sectionHeader}>About</Text>
                    <Text style={styles.descriptionText}>{house.description}</Text>

                    {/* Amenities */}
                    {house.amenities && house.amenities.length > 0 && (
                        <>
                            <Text style={styles.sectionHeader}>Amenities</Text>
                            <View style={styles.tagsContainer}>
                                {house.amenities.map((item: string, idx: number) => (
                                    <View key={idx} style={styles.tag}>
                                        <Ionicons name="checkmark-circle" size={14} color="#0891B2" style={{ marginRight: 4 }} />
                                        <Text style={styles.tagText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Rules */}
                    {house.rules && house.rules.length > 0 && (
                        <>
                            <Text style={styles.sectionHeader}>House Rules</Text>
                            <View style={styles.rulesContainer}>
                                {house.rules.map((rule: string, idx: number) => (
                                    <View key={idx} style={styles.ruleItem}>
                                        <View style={styles.bullet} />
                                        <Text style={styles.ruleText}>{rule}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Bottom Actions */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => router.push(`/apply/bed?tenantId=${tenantId}&houseId=${houseId}`)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.applyButtonText}>Apply for a Bed</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0C1A2E',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#0C1A2E',
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
    },
    scrollContent: {
        paddingBottom: 100, // accommodate bottom bar
    },
    imagePlaceholder: {
        height: 200,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    infoSection: {
        padding: 20,
    },
    houseName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    addressText: {
        fontSize: 14,
        color: '#0891B2',
        marginLeft: 6,
        fontWeight: '500',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 8,
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        color: '#94A3B8',
        lineHeight: 24,
        marginBottom: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    tagText: {
        color: '#E2E8F0',
        fontSize: 14,
    },
    rulesContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0891B2',
        marginTop: 8,
        marginRight: 10,
    },
    ruleText: {
        flex: 1,
        color: '#CBD5E1',
        fontSize: 15,
        lineHeight: 22,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0C1A2E',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        paddingBottom: 32, // safe area approximation
    },
    applyButton: {
        backgroundColor: '#0891B2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    applyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

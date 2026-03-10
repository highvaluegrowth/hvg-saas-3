import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { applicationApi } from '@/lib/api/routes';
import { Ionicons } from '@expo/vector-icons';

interface Application {
    id: string;
    type: string;
    status: string;
    createdAt: string;
    applicantName: string;
    zipCode?: string;
}

export default function ApplicationStatusScreen() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = async () => {
        try {
            setError(null);
            const res = await applicationApi.getUserApplications();
            setApplications(res.applications as unknown as Application[]);
        } catch (e: unknown) {
            console.error('Failed to fetch applications:', e);
            setError('Failed to load application status. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchApplications();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return '#10b981'; // Emerald
            case 'rejected':
            case 'denied':
                return '#ef4444'; // Red
            case 'pending':
            case 'pending_triage':
            case 'reviewing':
                return '#0891b2'; // Cyan (replaced Amber to meet constraints)
            default:
                return '#64748b'; // Slate
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0891b2" />
                <Text style={styles.loadingText}>Loading applications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}>
                    <Ionicons name="arrow-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.title}>My Applications</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0891b2" />
                }
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchApplications}>
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : applications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#475569" />
                        <Text style={styles.emptyTitle}>No Applications Found</Text>
                        <Text style={styles.emptySub}>
                            {"You haven't submitted any applications yet, or they're currently unavailable."}
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => router.push('/apply/bed')}
                        >
                            <Text style={styles.primaryBtnText}>Apply for a Bed</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            // Adjust this action to go to a support screen or open email
                            onPress={() => alert('Contacting support...')}
                        >
                            <Text style={styles.secondaryBtnText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {applications.map((app) => (
                            <View key={app.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.typeBadge}>
                                        {app.type.toUpperCase()} APPLICATION
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: `${getStatusColor(app.status)}20` }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: getStatusColor(app.status) }
                                            ]}
                                        >
                                            {app.status === 'pending_triage' ? 'UNDER GLOBAL REVIEW' : app.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardBody}>
                                    <Text style={styles.appName}>{app.applicantName}</Text>
                                    <Text style={styles.appDate}>
                                        Submitted on: {new Date(app.createdAt).toLocaleDateString()}
                                    </Text>
                                    {app.zipCode && (
                                        <Text style={styles.appDetail}>ZIP: {app.zipCode}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Slate 900
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#1e293b', // Slate 800
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
        fontSize: 16,
    },
    retryBtn: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#f8fafc',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
        marginTop: 24,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    primaryBtn: {
        backgroundColor: '#0891b2', // Cyan instead of Amber
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#334155',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 16,
    },
    listContainer: {
        gap: 16,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    typeBadge: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardBody: {
        padding: 16,
    },
    appName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 6,
    },
    appDate: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 4,
    },
    appDetail: {
        fontSize: 14,
        color: '#64748b',
    },
});

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { searchHousesWithinRadius, GeoLocation, SearchResultHouse } from '../../lib/features/search/geoService';

// Fallback coordinates (Austin, TX) — used only if location permission denied
const DEFAULT_LOCATION: GeoLocation = { lat: 30.2672, lng: -97.7431 };
const RADII_KM = [5, 10, 25, 50];

export default function SearchScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<SearchResultHouse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [radius, setRadius] = useState<number>(10);
    const [searchQuery, setSearchQuery] = useState('');
    const locationRef = useRef<GeoLocation>(DEFAULT_LOCATION);

    const handleSearch = async (r: number, loc: GeoLocation) => {
        setLoading(true);
        setError(null);
        try {
            const houses = await searchHousesWithinRadius(loc, r);
            setResults(houses);
        } catch (err: any) {
            console.warn('Failed to search houses:', err);
            setError(err?.message || 'Failed to load results. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function init() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            }
            handleSearch(radius, locationRef.current);
        }
        init();
    }, []);

    useEffect(() => {
        // Skip on initial mount — init() handles the first search
        handleSearch(radius, locationRef.current);
    }, [radius]);

    const renderHouse = ({ item }: { item: SearchResultHouse }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/houses/${item.id}?tenantId=${item.tenantId}`)}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name || 'Sober Living Home'}</Text>
                <Text style={styles.distanceText}>{(item.distance).toFixed(1)} km away</Text>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description || 'A supportive community environment.'}
            </Text>
            {(item.address || item.city) && (
                <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={14} color="#0891B2" />
                    <Text style={styles.addressText}>
                        {item.address} {item.city ? `, ${item.city}` : ''}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find a Program</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Input */}
            <View style={styles.searchSection}>
                <View style={styles.inputContainer}>
                    <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by city or zip..."
                        placeholderTextColor="#64748B"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => handleSearch(radius, locationRef.current)}
                    />
                </View>
            </View>

            {/* Radius Filters */}
            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Distance:</Text>
                <View style={styles.pillContainer}>
                    {RADII_KM.map(r => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.pill, radius === r && styles.pillActive]}
                            onPress={() => setRadius(r)}
                        >
                            <Text style={[styles.pillText, radius === r && styles.pillTextActive]}>
                                {r} km
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Results */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0891B2" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderHouse}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        error ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
                                <Text style={styles.emptyText}>Unable to load results</Text>
                                <Text style={styles.emptySubtext}>{error}</Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={() => handleSearch(radius, locationRef.current)}
                                >
                                    <Text style={styles.retryButtonText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="home-outline" size={48} color="#334155" />
                                <Text style={styles.emptyText}>No programs found in this area.</Text>
                                <Text style={styles.emptySubtext}>Try increasing your search radius.</Text>
                            </View>
                        )
                    }
                />
            )}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    searchSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        color: '#FFF',
        fontSize: 16,
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filterLabel: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pillActive: {
        backgroundColor: 'rgba(8, 145, 178, 0.2)',
        borderColor: '#0891B2',
    },
    pillText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
    pillTextActive: {
        color: '#0891B2',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        flex: 1,
        marginRight: 12,
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0891B2',
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardDescription: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    addressText: {
        color: '#64748B',
        fontSize: 13,
        marginLeft: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#64748B',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        borderWidth: 1,
        borderColor: '#0891B2',
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#0891B2',
        fontSize: 14,
        fontWeight: '600',
    },
});

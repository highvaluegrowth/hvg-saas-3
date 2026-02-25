import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Simple mock list for the LMS index
export default function LMSIndex() {
    const router = useRouter();

    const mockCourses = [
        { id: '1', title: 'Intro to Recovery' },
        { id: '2', title: 'House Rules & Orientation' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Learning Center</Text>
            <Text style={styles.subtitle}>View your assigned and available courses.</Text>

            <ScrollView style={styles.list}>
                {mockCourses.map((course) => (
                    <TouchableOpacity
                        key={course.id}
                        style={styles.card}
                        onPress={() => router.push(`/lms/${course.id}`)}
                    >
                        <Text style={styles.cardTitle}>{course.title}</Text>
                        <Text style={styles.cardSubtitle}>Tap to resume</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 20,
    },
    list: {
        flex: 1,
    },
    card: {
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    }
});

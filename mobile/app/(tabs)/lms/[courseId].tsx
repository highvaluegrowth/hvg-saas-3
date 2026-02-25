import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// Moving interfaces into the file context since it's a route
interface Lesson {
    id: string;
    title: string;
    type: string;
    [key: string]: unknown;
}

interface Module {
    id: string;
    title: string;
    lessons?: Lesson[];
    [key: string]: unknown;
}

export default function CourseViewerScreen() {
    const { courseId } = useLocalSearchParams();

    // Mock Modules data that would normally be fetched
    const modules: Module[] = [
        {
            id: 'm1',
            title: 'Module 1: Introduction',
            lessons: [{ id: 'l1', title: 'Welcome to the Program', type: 'VIDEO' }]
        },
        {
            id: 'm2',
            title: 'Module 2: Coping Strategies',
            lessons: [{ id: 'l2', title: 'Understanding Triggers', type: 'TEXT' }, { id: 'l3', title: 'Triggers Quiz', type: 'QUIZ' }]
        },
    ];

    const [activeModule, setActiveModule] = useState(modules[0]?.id || null);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Course {courseId}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moduleTabs}>
                {modules.map(mod => (
                    <TouchableOpacity
                        key={mod.id}
                        style={[styles.tab, activeModule === mod.id && styles.activeTab]}
                        onPress={() => setActiveModule(mod.id)}
                    >
                        <Text style={[styles.tabText, activeModule === mod.id && styles.activeTabText]}>
                            {mod.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.lessonList}>
                {modules.find(m => m.id === activeModule)?.lessons?.map((lesson) => (
                    <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        <Text style={styles.lessonType}>{lesson.type}</Text>
                    </TouchableOpacity>
                ))}

                {(!modules.find(m => m.id === activeModule)?.lessons || modules.find(m => m.id === activeModule)?.lessons?.length === 0) && (
                    <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 32 }}>No lessons in this module.</Text>
                )}
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
        marginBottom: 16,
    },
    moduleTabs: {
        maxHeight: 50,
        marginBottom: 16,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    activeTab: {
        backgroundColor: '#0f172a',
    },
    tabText: {
        color: '#64748b',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    lessonList: {
        flex: 1,
    },
    lessonCard: {
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    lessonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    lessonType: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'capitalize',
    }
});

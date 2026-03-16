import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileCourseDetail } from '@/lib/api/routes';

const OFFLINE_COURSES_KEY = '@hvg_offline_courses';
const OFFLINE_COMPLETION_KEY = '@hvg_offline_completion';

export function useOfflineCourse(courseId: string) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    checkDownloadStatus();
  }, [courseId]);

  const checkDownloadStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_COURSES_KEY);
      if (stored) {
        const courses = JSON.parse(stored);
        setIsDownloaded(!!courses[courseId]);
      }
    } catch (e) {
      console.error('Error checking download status', e);
    }
  };

  const downloadCourse = async (courseDetail: MobileCourseDetail) => {
    setIsDownloading(true);
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_COURSES_KEY);
      const courses = stored ? JSON.parse(stored) : {};
      courses[courseId] = {
        ...courseDetail,
        downloadedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(OFFLINE_COURSES_KEY, JSON.stringify(courses));
      setIsDownloaded(true);
    } catch (e) {
      console.error('Error downloading course', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const removeDownload = async () => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_COURSES_KEY);
      if (stored) {
        const courses = JSON.parse(stored);
        delete courses[courseId];
        await AsyncStorage.setItem(OFFLINE_COURSES_KEY, JSON.stringify(courses));
        setIsDownloaded(false);
      }
    } catch (e) {
      console.error('Error removing download', e);
    }
  };

  const markLessonOffline = async (lessonId: string) => {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_COMPLETION_KEY);
      const completions = stored ? JSON.parse(stored) : {};
      if (!completions[courseId]) completions[courseId] = [];
      if (!completions[courseId].includes(lessonId)) {
        completions[courseId].push(lessonId);
        await AsyncStorage.setItem(OFFLINE_COMPLETION_KEY, JSON.stringify(completions));
      }
    } catch (e) {
      console.error('Error marking lesson offline', e);
    }
  };

  return {
    isDownloaded,
    isDownloading,
    downloadCourse,
    removeDownload,
    markLessonOffline,
  };
}

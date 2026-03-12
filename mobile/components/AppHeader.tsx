import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/lib/auth/AuthContext';

interface AppHeaderProps {
  title?: string;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  searchMode?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
}

export function AppHeader({
  title = 'HVG',
  onProfilePress,
  onSettingsPress,
  searchMode = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search HVG...',
}: AppHeaderProps) {
  const { appUser } = useAuth();
  const insets = useSafeAreaInsets();

  const initials = appUser?.displayName
    ? appUser.displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 4 },
      ]}
    >
      {/* Left — Avatar / Profile button */}
      <TouchableOpacity
        onPress={onProfilePress}
        style={styles.avatarBtn}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.avatar}>
          {initials ? (
            <Text style={styles.avatarText}>{initials}</Text>
          ) : (
            <MaterialIcons name="person" size={20} color="#f8fafc" />
          )}
        </View>
      </TouchableOpacity>

      {/* Center — Title or Search */}
      <View style={styles.centerWrap}>
        {searchMode ? (
          <TextInput
            style={styles.searchInput}
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor="#475569"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        ) : (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      {/* Right — Settings */}
      <TouchableOpacity
        onPress={onSettingsPress}
        style={styles.settingsBtn}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="settings" size={22} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0f1e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
    minHeight: 56,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  searchInput: {
    width: '100%',
    height: 36,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

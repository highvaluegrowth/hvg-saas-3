import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Base tab bar height before adding the system nav inset */
export const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 88 : 68;

/**
 * Returns the full tab bar height including the bottom safe-area inset
 * (Android system nav bar / iOS home indicator).
 * Must be called inside a component tree wrapped by SafeAreaProvider.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + insets.bottom;
}

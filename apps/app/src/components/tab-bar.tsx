/** Pływający pasek zakładek w białej pigułce (wg makiet). */
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalculatorIcon, HistoryIcon, LibraryIcon } from '@/components/icons';
import { Text } from '@/components/ui';
import { layout, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export const TAB_BAR_HEIGHT = 64;

const ICONS: Record<string, (p: { color: string }) => React.JSX.Element> = {
  index: CalculatorIcon,
  library: LibraryIcon,
  history: HistoryIcon,
};

export function FloatingTabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { backgroundColor: theme.surface }]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key]!;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = ICONS[route.name] ?? CalculatorIcon;
          const color = focused ? theme.onInk : theme.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                if (!focused) navigateToTab(route.key);
              }}
              style={[styles.tab, focused && { backgroundColor: theme.ink }]}>
              <Icon color={color} />
              <Text variant="small" color={focused ? 'onInk' : 'muted'} style={{ fontSize: 11 }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: layout.pagePadding },
  bar: { flexDirection: 'row', width: '100%', maxWidth: layout.maxContentWidth, borderRadius: radius.xl, padding: 6, gap: 2 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 52, borderRadius: 14, paddingVertical: 8 },
});

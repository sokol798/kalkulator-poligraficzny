import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { t } from '@/i18n/pl';
import { palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

type Icon = SymbolViewProps['name'];

const ICONS: Record<string, Icon> = {
  index: { ios: 'rectangle.grid.2x2', android: 'grid_view', web: 'grid_view' } as Icon,
  compare: { ios: 'tablecells', android: 'table_chart', web: 'table_chart' } as Icon,
  booklet: { ios: 'book', android: 'menu_book', web: 'menu_book' } as Icon,
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' } as Icon,
};

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = palette[scheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navTheme,
        colors: { ...navTheme.colors, background: colors.bg, card: colors.surface, border: colors.border, text: colors.text, primary: colors.accent },
      }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarIcon: ({ color, size }) => (
            <SymbolView name={ICONS[route.name] ?? ICONS.index!} tintColor={color} size={Platform.OS === 'web' ? 22 : size} />
          ),
        })}>
        <Tabs.Screen name="index" options={{ title: t.tabs.calc }} />
        <Tabs.Screen name="compare" options={{ title: t.tabs.compare }} />
        <Tabs.Screen name="booklet" options={{ title: t.tabs.booklet }} />
        <Tabs.Screen name="settings" options={{ title: t.tabs.settings }} />
      </Tabs>
    </ThemeProvider>
  );
}

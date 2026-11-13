import '@/global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { cleanupLegacyServiceWorker } from '@/lib/cleanup-legacy-sw';
import { palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = palette[scheme === 'dark' ? 'dark' : 'light'];
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });

  useEffect(() => {
    if (fontsLoaded || fontError || Platform.OS === 'web') SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    void cleanupLegacyServiceWorker();
  }, []);

  if (!fontsLoaded && !fontError && Platform.OS !== 'web') return null;

  const nav = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const sheet = { presentation: 'formSheet' as const, sheetAllowedDetents: [0.82, 1], sheetGrabberVisible: true, sheetCornerRadius: 24, headerShown: false };

  return (
    <ThemeProvider value={{ ...nav, colors: { ...nav.colors, background: colors.bg, card: colors.surface, border: colors.border, text: colors.ink, primary: colors.ink } }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="library" />
        <Stack.Screen name="history" />
        <Stack.Screen name="pick-format" options={sheet} />
        <Stack.Screen name="pick-sheet" options={sheet} />
        <Stack.Screen name="card" />
        <Stack.Screen name="new-format" />
        <Stack.Screen name="new-sheet" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/[item]" />
        <Stack.Screen name="help" />
      </Stack>
    </ThemeProvider>
  );
}

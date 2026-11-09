import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/tab-bar';
import { t } from '@/i18n/pl';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t.tabs.calc }} />
      <Tabs.Screen name="library" options={{ title: t.tabs.library }} />
      <Tabs.Screen name="history" options={{ title: t.tabs.history }} />
    </Tabs>
  );
}

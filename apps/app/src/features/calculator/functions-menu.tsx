/** Tytuł „Kalkulator” ze strzałką i rozwijane menu funkcji. */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CalculatorIcon, ChevronDown, ChevronRight, GearIcon, HistoryIcon, LibraryIcon } from '@/components/icons';
import { Card, Hairline, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function MenuTitle({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={open ? t.menu.close : t.menu.open}
      accessibilityState={{ expanded: open }}
      hitSlop={8}
      style={({ pressed }) => [styles.title, pressed && { opacity: 0.7 }]}>
      <Text variant="screenTitle">{title}</Text>
      <View style={[styles.arrow, { backgroundColor: theme.surface, transform: [{ rotate: open ? '180deg' : '0deg' }] }]}>
        <ChevronDown color={theme.ink} size={11} />
      </View>
    </Pressable>
  );
}

interface MenuProps {
  onClose: () => void;
  onNewCalculation: () => void;
  cardDisabled?: boolean;
}

export function FunctionsMenu({ onClose, onNewCalculation, cardDisabled }: MenuProps) {
  const theme = useTheme();
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };
  const items: { label: string; icon: React.ReactNode; onPress: () => void; disabled?: boolean }[] = [
    { label: t.menu.card, icon: <CalculatorIcon color={theme.ink} />, onPress: go(() => router.push('/card')), disabled: cardDisabled },
    { label: t.menu.newCalc, icon: <CalculatorIcon color={theme.ink} />, onPress: go(onNewCalculation) },
    { label: t.menu.library, icon: <LibraryIcon color={theme.ink} />, onPress: go(() => router.navigate('/library')) },
    { label: t.menu.history, icon: <HistoryIcon color={theme.ink} />, onPress: go(() => router.navigate('/history')) },
    { label: t.menu.settings, icon: <GearIcon color={theme.ink} />, onPress: go(() => router.push('/settings')) },
    { label: t.menu.help, icon: <GearIcon color={theme.ink} />, onPress: go(() => router.push('/help')) },
  ];
  return (
    <Card style={{ paddingVertical: 4, gap: 0 }} accessibilityRole="menu">
      {items.map((it, i) => (
        <View key={it.label}>
          <Pressable
            onPress={it.onPress}
            disabled={it.disabled}
            accessibilityRole="menuitem"
            style={({ pressed }) => [styles.item, { opacity: it.disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
            {it.icon}
            <Text variant="body" style={{ flex: 1 }}>
              {it.label}
            </Text>
            <ChevronRight color={theme.muted} />
          </Pressable>
          {i < items.length - 1 ? <Hairline /> : null}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  arrow: { width: 24, height: 24, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 6 },
});

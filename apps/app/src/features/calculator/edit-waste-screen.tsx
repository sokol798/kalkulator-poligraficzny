/** Arkusz dolny: naddatek technologiczny (%). */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { Card, IconButton, Label, PillButton, Screen, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { WASTE_OPTIONS } from '@/lib/library-data';
import { useAppStore } from '@/store/app-store';
import { layout, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const QUICK = [...WASTE_OPTIONS, 15, 20];

export function EditWasteScreen() {
  const theme = useTheme();
  const waste = useAppStore((s) => s.inputs.wastePercent);
  const minSheets = useAppStore((s) => s.settings.wasteMinSheets);
  const setInput = useAppStore((s) => s.setInput);
  const set = (v: number) => setInput('wastePercent', Math.max(0, Math.min(100, v)));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text variant="headerTitle" style={{ fontSize: 18 }}>
            {t.calc.editWaste}
          </Text>
          <IconButton accessibilityLabel={t.common.close} onPress={close} size={36} style={{ backgroundColor: theme.field }}>
            <CloseIcon color={theme.ink} />
          </IconButton>
        </View>
      }>
      <Card>
        <Label>{t.calc.wasteCard}</Label>
        <Label style={{ fontSize: 11 }}>{t.calc.wasteHint}</Label>
        <View style={styles.row}>
          <NumberField value={waste} onChange={set} decimals={1} max={100} size="lg" placeholder="0" accessibilityLabel={t.calc.waste} format={(n) => (n > 0 ? String(n).replace('.', ',') : '')} />
          <Text variant="value" color="muted">
            %
          </Text>
        </View>
        <View style={styles.chips}>
          {QUICK.filter((q) => q > 0).map((q) => (
            <Pressable key={q} onPress={() => set(q)} accessibilityRole="button" style={({ pressed }) => [styles.chip, { backgroundColor: waste === q ? theme.ink : theme.surface, borderColor: waste === q ? theme.ink : theme.border, opacity: pressed ? 0.7 : 1 }]}>
              <Text variant="label" color={waste === q ? 'onInk' : 'ink'}>
                {`${q} %`}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => set(0)} accessibilityRole="button" style={({ pressed }) => [styles.chip, { backgroundColor: waste === 0 ? theme.ink : theme.surface, borderColor: waste === 0 ? theme.ink : theme.border, borderStyle: waste === 0 ? 'solid' : 'dashed', opacity: pressed ? 0.7 : 1 }]}>
            <Text variant="label" color={waste === 0 ? 'onInk' : 'muted'}>
              {t.calc.noWaste}
            </Text>
          </Pressable>
        </View>
        {minSheets > 0 ? <Label style={{ fontSize: 11 }}>{`${t.settings.wasteMin}: ${minSheets} ${t.common.sheets}`}</Label> : null}
      </Card>
      <PillButton title={t.calc.done} onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { paddingHorizontal: 12, minHeight: layout.controlSm, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

/** Arkusz dolny: cena za arkusz (zł). */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { Card, IconButton, Label, PillButton, Screen, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { fmtDec } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { layout, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const QUICK = [0.5, 0.8, 1, 1.2, 1.5, 2, 3];

export function EditPriceScreen() {
  const theme = useTheme();
  const price = useAppStore((s) => s.inputs.pricePerSheet);
  const setInput = useAppStore((s) => s.setInput);
  const set = (v: number) => setInput('pricePerSheet', Math.max(0, v));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text variant="headerTitle" style={{ fontSize: 18 }}>
            {t.calc.editPrice}
          </Text>
          <IconButton accessibilityLabel={t.common.close} onPress={close} size={36} style={{ backgroundColor: theme.field }}>
            <CloseIcon color={theme.ink} />
          </IconButton>
        </View>
      }>
      <Card>
        <Label>{t.calc.priceCard}</Label>
        <Label style={{ fontSize: 11 }}>{t.calc.priceHint}</Label>
        <View style={styles.row}>
          <NumberField value={price} onChange={set} decimals={2} size="lg" placeholder={t.calc.pricePlaceholder} accessibilityLabel={t.calc.price} format={(n) => (n > 0 ? n.toFixed(2).replace('.', ',') : '')} />
          <Text variant="value" color="muted">
            {t.settings.pln}
          </Text>
        </View>
        <View style={styles.chips}>
          {QUICK.map((q) => (
            <Pressable key={q} onPress={() => set(q)} accessibilityRole="button" style={({ pressed }) => [styles.chip, { backgroundColor: price === q ? theme.ink : theme.surface, borderColor: price === q ? theme.ink : theme.border, opacity: pressed ? 0.7 : 1 }]}>
              <Text variant="label" color={price === q ? 'onInk' : 'ink'}>
                {fmtDec(q, 2)}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => set(0)} accessibilityRole="button" style={({ pressed }) => [styles.chip, { backgroundColor: theme.surface, borderColor: theme.border, borderStyle: 'dashed', opacity: pressed ? 0.7 : 1 }]}>
            <Text variant="label" color="muted">
              {t.calc.noPrice}
            </Text>
          </Pressable>
        </View>
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

/** Arkusz dolny: edycja nakładu (pole, ±, bęben). */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { QuantityDrum, stepQuantity } from '@/components/quantity-drum';
import { Card, IconButton, Label, PillButton, Screen, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { fmtInt } from '@/lib/format';
import { QUANTITY_MAX } from '@/lib/library-data';
import { useAppStore } from '@/store/app-store';
import { layout, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const QUICK = [100, 250, 500, 1000, 2500, 5000, 10000];

export function EditQuantityScreen() {
  const theme = useTheme();
  const quantity = useAppStore((s) => s.inputs.quantity);
  const setInput = useAppStore((s) => s.setInput);
  const set = (q: number) => setInput('quantity', Math.max(0, Math.min(QUANTITY_MAX, q)));
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text variant="headerTitle" style={{ fontSize: 18 }}>
            {t.calc.editQuantity}
          </Text>
          <IconButton accessibilityLabel={t.common.close} onPress={close} size={36} style={{ backgroundColor: theme.field }}>
            <CloseIcon color={theme.ink} />
          </IconButton>
        </View>
      }>
      <Card>
        <View style={styles.between}>
          <Label>{t.calc.quantity}</Label>
          <Label style={{ fontSize: 11 }}>{t.calc.quantityMax}</Label>
        </View>
        <View style={styles.stepper}>
          <Step label="−" onPress={() => set(stepQuantity(quantity, -1))} accessibilityLabel={t.calc.less} />
          <NumberField value={quantity} onChange={set} decimals={0} max={QUANTITY_MAX} size="lg" format={fmtInt} accessibilityLabel={t.calc.quantity} />
          <Step label="+" onPress={() => set(stepQuantity(quantity, 1))} accessibilityLabel={t.calc.moreQty} />
        </View>
        <QuantityDrum value={quantity} onChange={set} />
      </Card>
      <View style={styles.chips}>
        {QUICK.map((q) => (
          <Pressable key={q} onPress={() => set(q)} accessibilityRole="button" style={({ pressed }) => [styles.chip, { backgroundColor: quantity === q ? theme.ink : theme.surface, borderColor: quantity === q ? theme.ink : theme.border, opacity: pressed ? 0.7 : 1 }]}>
            <Text variant="label" color={quantity === q ? 'onInk' : 'ink'}>
              {fmtInt(q)}
            </Text>
          </Pressable>
        ))}
      </View>
      <PillButton title={t.calc.done} onPress={close} />
    </Screen>
  );
}

function Step({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel: string }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.step, { backgroundColor: theme.field, opacity: pressed ? 0.7 : 1 }]}>
      <Text variant="input">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  step: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: 12, minHeight: layout.controlSm, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

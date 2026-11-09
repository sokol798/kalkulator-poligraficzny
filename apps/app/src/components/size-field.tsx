/** Para pól szer. × wys. z przyciskiem obrotu i (opcjonalnie) wyborem presetu. */
import type { SheetFormat, Size } from '@printcalc/core';
import { StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/number-field';
import { PresetPicker } from '@/components/preset-picker';
import { Button, Row, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { spacing } from '@/theme/tokens';

interface Props {
  label: string;
  presetLabel: string;
  size: Size;
  presetId: string | null;
  presets: SheetFormat[];
  onChange: (size: Size, presetId: string | null) => void;
  onSwap: () => void;
}

export function SizeField({ label, presetLabel, size, presetId, presets, onChange, onSwap }: Props) {
  return (
    <>
      <Row label={presetLabel}>
        <PresetPicker
          formats={presets}
          selectedId={presetId}
          customLabel={t.product.custom}
          onSelect={(f) => onChange({ ...f.size }, f.id)}
        />
      </Row>
      <Row label={label} hint="szer. × wys.">
        <View style={styles.pair}>
          <NumberField value={size.width} onChange={(w) => onChange({ width: w, height: size.height }, null)} width={88} decimals={1} />
          <Text variant="label" color="textFaint">
            ×
          </Text>
          <NumberField value={size.height} onChange={(h) => onChange({ width: size.width, height: h }, null)} width={88} decimals={1} unit="mm" />
          <Button title="⇄" onPress={onSwap} small />
        </View>
      </Row>
    </>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});

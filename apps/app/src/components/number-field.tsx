/**
 * Pole liczbowe: akceptuje przecinek i kropkę, trzyma lokalny tekst podczas edycji,
 * a do store'u zapisuje liczbę dopiero przy poprawnej wartości.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, Platform } from 'react-native';

import { Text } from '@/components/ui';
import { layout, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  /** Liczba miejsc po przecinku akceptowana w polu (0 = tylko całkowite). */
  decimals?: number;
  width?: number;
  placeholder?: string;
  testID?: string;
}

function format(n: number): string {
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n * 1000) / 1000).replace('.', ',');
}

export function parseNumber(text: string): number | null {
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  if (normalized === '' || normalized === '.' || normalized === '-') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function NumberField({ value, onChange, unit, min = 0, max, decimals = 2, width = 96, placeholder, testID }: NumberFieldProps) {
  const theme = useTheme();
  const [text, setText] = useState(format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(format(value));
  }, [value, focused]);

  const handleChange = (raw: string) => {
    const allowed = decimals > 0 ? /[^0-9.,-]/g : /[^0-9-]/g;
    const cleaned = raw.replace(allowed, '');
    setText(cleaned);
    const n = parseNumber(cleaned);
    if (n == null) return;
    let v = n;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    onChange(v);
  };

  const invalid = text !== '' && parseNumber(text) == null;

  return (
    <View
      style={[
        styles.wrap,
        { width, backgroundColor: theme.surfaceAlt, borderColor: invalid ? theme.danger : focused ? theme.accent : theme.border },
      ]}>
      <TextInput
        testID={testID}
        value={text}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setText(format(value));
        }}
        keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        selectTextOnFocus
        placeholder={placeholder}
        placeholderTextColor={theme.textFaint}
        style={[styles.input, typography.value, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
      />
      {unit ? (
        <Text variant="small" color="textFaint" style={styles.unit}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: layout.controlHeight,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  input: { flex: 1, textAlign: 'right', paddingVertical: 0, minWidth: 0 },
  unit: { minWidth: 22 },
});

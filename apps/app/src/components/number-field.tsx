/**
 * Pole liczbowe (przecinek i kropka, lokalny tekst podczas edycji, zapis do stanu dopiero po poprawnej wartości).
 */
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { layout, radius, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decimals?: number;
  placeholder?: string;
  accessibilityLabel: string;
  /** Duże pole w karcie (20 px) czy małe w pigułce. */
  size?: 'lg' | 'md' | 'sm';
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Podpis pod polem. */
  caption?: string;
  /** Sformatowanie wyświetlanej wartości (np. 1 000). */
  format?: (n: number) => string;
  surface?: boolean;
  /** Stała szerokość (zamiast flex: 1). */
  width?: number;
}

export function parseNumber(text: string): number | null {
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  if (normalized === '' || normalized === '.' || normalized === '-') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

const defaultFormat = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 1000) / 1000).replace('.', ',') : '');

export function NumberField({ value, onChange, min = 0, max, decimals = 2, placeholder, accessibilityLabel, size = 'lg', pill, style, caption, format = defaultFormat, surface, width }: NumberFieldProps) {
  const theme = useTheme();
  const [text, setText] = useState(format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(format(value));
  }, [value, focused, format]);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(decimals > 0 ? /[^0-9.,]/g : /[^0-9]/g, '');
    setText(cleaned);
    const n = parseNumber(cleaned);
    if (n == null) return;
    let v = n;
    if (v < min) v = min;
    if (max != null && v > max) v = max;
    onChange(v);
  };

  const invalid = text !== '' && parseNumber(text) == null;
  const height = size === 'lg' ? 52 : size === 'md' ? layout.control : layout.controlSm;
  const font = size === 'lg' ? typography.input : size === 'md' ? { ...typography.value, fontSize: 16 } : typography.label;

  return (
    <View style={[width ? { width, flexGrow: 0, flexShrink: 0 } : styles.wrap, style]}>
      <TextInput
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
        placeholderTextColor={theme.muted}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.input,
          font,
          {
            height,
            borderRadius: pill ? radius.pill : radius.md,
            backgroundColor: surface ? theme.surface : theme.field,
            borderColor: invalid ? theme.danger : focused ? theme.ink : surface ? theme.surface : theme.field,
            color: theme.ink,
          },
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
        ]}
      />
      {caption ? (
        <Text variant="small" color="muted" style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0 },
  input: { borderWidth: 1, textAlign: 'center', paddingHorizontal: 6, paddingVertical: 0, width: '100%' },
  caption: { textAlign: 'center', marginTop: 4 },
});

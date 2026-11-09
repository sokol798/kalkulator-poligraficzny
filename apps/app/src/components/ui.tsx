/**
 * Podstawowe prymitywy UI: Screen, Card, SectionTitle, Row, Text, Button, Segmented, SwitchRow.
 * Wszystkie style pochodzą z tokenów – to tutaj designer podmienia wygląd.
 */
import type { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, radius, spacing, typography, type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Variant = keyof typeof typography;

export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps & { variant?: Variant; color?: ColorToken }) {
  const theme = useTheme();
  return <RNText style={[typography[variant], { color: theme[color] }, style]} {...rest} />;
}

export function Screen({ children, title }: PropsWithChildren<{ title?: string }>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxl * 2 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.content}>
          {title ? (
            <Text variant="title" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]} {...rest}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="section" color="textMuted">
        {children}
      </Text>
      {right}
    </View>
  );
}

/** Wiersz formularza: etykieta po lewej, kontrolka po prawej. */
export function Row({ label, children, hint, style }: PropsWithChildren<{ label: string; hint?: string; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }, style]}>
      <View style={styles.rowLabel}>
        <Text variant="label">{label}</Text>
        {hint ? (
          <Text variant="small" color="textFaint">
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
}

/** Wiersz wyniku: etykieta + wartość (mono). */
export function ResultRow({ label, value, unit, emphasis, tone }: { label: string; value: string | number; unit?: string; emphasis?: boolean; tone?: ColorToken }) {
  const theme = useTheme();
  return (
    <View style={[styles.resultRow, { borderBottomColor: theme.border }]}>
      <Text variant="label" color="textMuted" style={styles.flex}>
        {label}
      </Text>
      <Text variant="value" color={tone ?? (emphasis ? 'accent' : 'text')}>
        {value}
        {unit ? <Text variant="small" color="textFaint">{` ${unit}`}</Text> : null}
      </Text>
    </View>
  );
}

export function StatTile({ label, value, unit, tone }: { label: string; value: string | number; unit?: string; tone?: ColorToken }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <Text variant="small" color="textMuted">
        {label}
      </Text>
      <View style={styles.tileValue}>
        <Text variant="bigValue" color={tone ?? 'text'}>
          {value}
        </Text>
        {unit ? (
          <Text variant="label" color="textFaint">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function Button({ title, onPress, kind = 'secondary', small, style }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost'; small?: boolean; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const bg = kind === 'primary' ? theme.accent : kind === 'secondary' ? theme.surfaceAlt : 'transparent';
  const fg: ColorToken = kind === 'primary' ? 'onAccent' : kind === 'ghost' ? 'accent' : 'text';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, borderColor: kind === 'secondary' ? theme.border : 'transparent', opacity: pressed ? 0.7 : 1 },
        style,
      ]}>
      <Text variant="label" color={fg}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: theme.surface, borderColor: theme.borderStrong }]}>
            <Text variant="label" color={active ? 'text' : 'textMuted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const theme = useTheme();
  return (
    <Row label={label} hint={hint}>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.accent, false: theme.borderStrong }} thumbColor={theme.surface} />
    </Row>
  );
}

export function Notice({ children, tone = 'warning' }: PropsWithChildren<{ tone?: 'warning' | 'danger' | 'success' }>) {
  const theme = useTheme();
  return (
    <View style={[styles.notice, { borderColor: theme[tone], backgroundColor: theme.surfaceAlt }]}>
      <Text variant="small" color={tone}>
        {children}
      </Text>
    </View>
  );
}

export const textStyle = (s: TextStyle) => s;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: spacing.lg },
  content: { width: '100%', maxWidth: layout.maxContentWidth, gap: spacing.lg },
  title: { marginBottom: spacing.xs },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flex: 1, minWidth: 110 },
  rowControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-end', flexShrink: 0 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.md },
  flex: { flex: 1 },
  tile: { flex: 1, minWidth: 140, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  tileValue: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  button: { height: layout.controlHeight, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { height: 32, paddingHorizontal: spacing.md },
  segmented: { flexDirection: 'row', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: 2 },
  segment: { paddingHorizontal: spacing.md, height: layout.controlHeight - 6, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
  notice: { borderLeftWidth: 3, borderRadius: radius.sm, padding: spacing.md },
});

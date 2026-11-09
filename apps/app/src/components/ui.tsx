/**
 * Prymitywy UI wg makiet: Screen, Header, Card, Chip, PillButton, Segmented, IconButton, Row, SectionLabel, ListItem, Toggle.
 * Style wyłącznie z tokenów.
 */
import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text as RNText, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/components/icons';
import { t } from '@/i18n/pl';
import { layout, radius, spacing, typography, type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Variant = keyof typeof typography;

export function Text({ variant = 'body', color = 'ink', style, ...rest }: TextProps & { variant?: Variant; color?: ColorToken }) {
  const theme = useTheme();
  return <RNText style={[typography[variant], { color: theme[color] }, style]} {...rest} />;
}

/** Ekran z przewijaniem; `bottomInset` zostawia miejsce na pływający pasek zakładek. */
export function Screen({ children, header, bottomInset = 0, scroll = true, style }: PropsWithChildren<{ header?: ReactNode; bottomInset?: number; scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[styles.content, style]}>
      {header}
      {children}
    </View>
  );
  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md, paddingBottom: bottomInset + insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1, paddingTop: insets.top + spacing.md, paddingBottom: bottomInset + insets.bottom + spacing.xl }]}>{body}</View>
      )}
    </View>
  );
}

/** Nagłówek ekranu zakładki: duży tytuł + akcja po prawej. */
export function TabHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Text variant="screenTitle">{title}</Text>
      {right ?? <View style={{ width: layout.control }} />}
    </View>
  );
}

/** Nagłówek ekranu podrzędnego: wstecz · tytuł · akcja. */
export function StackHeader({ title, right, onBack, backLabel }: { title: string; right?: ReactNode; onBack?: () => void; backLabel?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <IconButton accessibilityLabel={backLabel ?? t.common.back} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}>
        <BackIcon color={theme.ink} />
      </IconButton>
      <Text variant="headerTitle">{title}</Text>
      {right ?? <View style={{ width: layout.control }} />}
    </View>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, style]} {...rest}>
      {children}
    </View>
  );
}

export function SectionLabel({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return (
    <Text variant="section" color="muted" style={[styles.section, style]}>
      {children}
    </Text>
  );
}

export function Label({ children, style, color = 'muted', ...rest }: PropsWithChildren<{ style?: StyleProp<TextStyle>; color?: ColorToken }> & Omit<TextProps, 'style'>) {
  return (
    <Text variant="label" color={color} style={style} {...rest}>
      {children}
    </Text>
  );
}

/** Pigułka wyboru (chip). `on` = czarna. `dashed` = „Więcej”. */
export function Chip({ label, on, dashed, small, onPress, icon, style, accessibilityLabel }: { label: string; on?: boolean; dashed?: boolean; small?: boolean; onPress?: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        { backgroundColor: on ? theme.ink : theme.surface, borderColor: on ? theme.ink : theme.border, borderStyle: dashed ? 'dashed' : 'solid', opacity: pressed ? 0.75 : 1 },
        style,
      ]}>
      <Text variant={small ? 'label' : 'body'} color={on ? 'onInk' : 'ink'} numberOfLines={1}>
        {label}
      </Text>
      {icon}
    </Pressable>
  );
}

/** Główny przycisk-pigułka. */
export function PillButton({ title, onPress, kind = 'primary', icon, style, disabled }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'dashed'; icon?: ReactNode; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const theme = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: primary ? theme.ink : theme.surface,
          borderColor: primary ? theme.ink : theme.border,
          borderStyle: kind === 'dashed' ? 'dashed' : 'solid',
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      <Text variant={primary ? 'bodySemibold' : 'body'} color={primary ? 'onInk' : 'ink'}>
        {title}
      </Text>
      {icon}
    </Pressable>
  );
}

export function IconButton({ children, onPress, accessibilityLabel, dark, bordered, size = layout.control, style }: PropsWithChildren<{ onPress?: () => void; accessibilityLabel: string; dark?: boolean; bordered?: boolean; size?: number; style?: StyleProp<ViewStyle> }> & Pick<PressableProps, 'disabled'>) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconBtn,
        { width: size, height: size, backgroundColor: dark ? theme.ink : theme.surface, borderColor: theme.border, borderWidth: bordered ? 1 : 0, opacity: pressed ? 0.75 : 1 },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

/** Segmentowany przełącznik w pigułce. */
export function Segmented<T extends string>({ options, value, onChange, style, surface }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle>; surface?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: surface ? theme.surface : theme.field }, style]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={({ pressed }) => [styles.segItem, on && { backgroundColor: surface ? theme.ink : theme.surface }, pressed && { opacity: 0.8 }]}>
            <Text variant="label" color={on ? (surface ? 'onInk' : 'ink') : 'muted'} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Wiersz listy / ustawień: lewa kolumna (tytuł + podpowiedź), prawa kontrolka. */
export function Row({ title, hint, children, last, onPress, style }: PropsWithChildren<{ title: string; hint?: string; last?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const content = (
    <View style={[styles.row, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }, style]}>
      <View style={styles.rowText}>
        <Text variant="body">{title}</Text>
        {hint ? (
          <Text variant="small" color="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

/** Wiersz klucz–wartość (karta zlecenia). */
export function KV({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.kv, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text variant="label" color="muted" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="body" style={{ textAlign: 'right', flexShrink: 1 }}>
        {value}
      </Text>
    </View>
  );
}

/** Biała karta-pozycja listy (biblioteka, historia). */
export function ListItem({ children, onPress, style }: PropsWithChildren<{ onPress?: () => void; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const inner = <View style={[styles.item, { backgroundColor: theme.surface }, style]}>{children}</View>;
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      {inner}
    </Pressable>
  ) : (
    inner
  );
}

export function Toggle({ value, onChange, accessibilityLabel }: { value: boolean; onChange: (v: boolean) => void; accessibilityLabel: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.toggle, { backgroundColor: value ? theme.ink : theme.border }]}>
      <View style={[styles.knob, { backgroundColor: theme.surface, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
  );
}

/** Miniatura kształtu formatu (proporcje). */
export function FormatThumb({ width, height, max = 40 }: { width: number; height: number; max?: number }) {
  const theme = useTheme();
  const s = max / Math.max(width, height);
  return <View style={{ width: Math.max(8, width * s), height: Math.max(8, height * s), backgroundColor: theme.field, borderColor: theme.border, borderWidth: 1, borderRadius: 3 }} />;
}

export function Hairline() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

export function Empty({ children }: PropsWithChildren) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      <Text variant="label" color="muted" style={{ textAlign: 'center' }}>
        {children}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: layout.pagePadding },
  content: { width: '100%', maxWidth: layout.maxContentWidth, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: layout.control, marginBottom: spacing.xs },
  card: { borderRadius: radius.lg, paddingHorizontal: layout.pagePadding, paddingVertical: 14, gap: spacing.md },
  section: { marginTop: spacing.sm, marginBottom: -spacing.xs, marginHorizontal: spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
  chipSmall: { paddingHorizontal: 12, minHeight: layout.controlSm },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.pill, minHeight: 50, paddingHorizontal: 18 },
  iconBtn: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', borderRadius: radius.pill, padding: 3, gap: 2 },
  segItem: { flex: 1, minHeight: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 12, minHeight: 52 },
  rowText: { flex: 1, gap: 2 },
  rowControl: { flexShrink: 0, alignItems: 'flex-end' },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, paddingHorizontal: layout.pagePadding, paddingVertical: 12, minHeight: 64 },
  toggle: { width: 46, height: 28, borderRadius: radius.pill, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: radius.pill },
});

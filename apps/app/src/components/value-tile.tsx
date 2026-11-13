/** Kwadratowy kafelek z wartością; dotknięcie otwiera edycję. */
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRight } from '@/components/icons';
import { Label, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

interface Props {
  label: string;
  value: string;
  unit?: string;
  muted?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function ValueTile({ label, value, unit, muted, onPress, accessibilityLabel }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: `${value}${unit ? ` ${unit}` : ''}` }}
      style={({ pressed }) => [styles.tile, { backgroundColor: theme.surface, opacity: pressed ? 0.75 : 1 }]}>
      <View style={styles.top}>
        <Label>{label}</Label>
        <ChevronRight color={theme.muted} size={12} />
      </View>
      <View style={styles.valueRow}>
        <Text variant="heroSmall" color={muted ? 'muted' : 'ink'} numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1 }}>
          {value}
        </Text>
        {unit ? (
          <Text variant="label" color="muted">
            {unit}
          </Text>
        ) : null}
      </View>
      <Label style={{ fontSize: 11 }}>{t.calc.tapToEdit}</Label>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 0, aspectRatio: 1.15, borderRadius: radius.lg, padding: spacing.lg, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
});

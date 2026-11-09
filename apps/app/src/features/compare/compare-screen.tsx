import { compareSheetFormats, formatSize } from '@printcalc/core';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Screen, Text } from '@/components/ui';
import { buildImpositionInput } from '@/hooks/use-calculation';
import { t } from '@/i18n/pl';
import { useCalculatorStore } from '@/store/calculator-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function CompareScreen() {
  const theme = useTheme();
  const inputs = useCalculatorStore((s) => s.inputs);
  const setSheet = useCalculatorStore((s) => s.setSheet);

  const rows = useMemo(() => {
    const { sheet: _sheet, ...base } = buildImpositionInput(inputs);
    return compareSheetFormats(base, inputs.quantity, inputs.wastePercent);
  }, [inputs]);

  return (
    <Screen title={t.compare.title}>
      <Card>
        <Text variant="small" color="textMuted">
          {t.compare.hint}
        </Text>
        <Text variant="small" color="textFaint">
          {`Użytek ${formatSize(inputs.item)}, spad ${inputs.bleed} mm, nakład ${inputs.quantity} szt.`}
        </Text>
      </Card>
      <Card style={{ paddingHorizontal: 0, paddingVertical: spacing.sm }}>
        <View style={[styles.row, styles.head, { borderBottomColor: theme.borderStrong }]}>
          <Text variant="section" color="textMuted" style={styles.cFormat}>{t.compare.cols.format}</Text>
          <Text variant="section" color="textMuted" style={styles.cNum}>{t.compare.cols.ups}</Text>
          <Text variant="section" color="textMuted" style={styles.cNum}>{t.compare.cols.sheets}</Text>
          <Text variant="section" color="textMuted" style={styles.cNum}>{t.compare.cols.area}</Text>
          <Text variant="section" color="textMuted" style={styles.cNum}>{t.compare.cols.util}</Text>
          <View style={styles.cAction} />
        </View>
        {rows.map((r, i) => {
          const current = r.format.id === inputs.sheetPresetId;
          return (
            <View key={r.format.id} style={[styles.row, { borderBottomColor: theme.border, backgroundColor: current ? theme.accentSoft : i % 2 ? theme.surfaceAlt : 'transparent' }]}>
              <View style={styles.cFormat}>
                <Text variant="label">{r.format.label}</Text>
                <Text variant="small" color="textFaint">{formatSize(r.format.size)}</Text>
              </View>
              <Text variant="value" style={styles.cNum}>{r.ups}</Text>
              <Text variant="value" style={styles.cNum}>{r.grossSheets}</Text>
              <Text variant="value" color={i === 0 ? 'success' : 'text'} style={styles.cNum}>{r.paperAreaM2}</Text>
              <Text variant="value" color="textMuted" style={styles.cNum}>{`${Math.round(r.utilization * 100)}%`}</Text>
              <View style={styles.cAction}>
                {!current ? (
                  <Button
                    title={t.compare.use}
                    small
                    onPress={() => {
                      setSheet({ ...r.format.size }, r.format.id);
                      router.navigate('/');
                    }}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  head: { paddingBottom: spacing.sm },
  cFormat: { flex: 2, minWidth: 90 },
  cNum: { flex: 1, textAlign: 'right' },
  cAction: { width: 64, alignItems: 'flex-end' },
});

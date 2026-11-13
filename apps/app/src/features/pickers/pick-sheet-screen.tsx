import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { Hairline, IconButton, Label, PillButton, Screen, SectionLabel, Text } from '@/components/ui';
import { quickUps, resolveSheet, useCalculation } from '@/hooks/use-calculation';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { fmtInt } from '@/lib/format';
import type { LibrarySheet } from '@/lib/library-data';
import { useAllSheets, useAppStore } from '@/store/app-store';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function PickSheetScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const sheets = useAllSheets();
  const inputs = useAppStore((s) => s.inputs);
  const rounding = useAppStore((s) => s.settings.rounding);
  const { applySheet, applyCustomSheet } = useAppStore();
  const calc = useCalculation();
  const settings = useAppStore((s) => s.settings);
  const [custom, setCustom] = useState({ width: inputs.customSheet?.width ?? 0, height: inputs.customSheet?.height ?? 0, marginTop: inputs.customSheet?.marginTop ?? settings.marginTop, marginSides: inputs.customSheet?.marginSides ?? settings.marginSides });

  const rows = useMemo(
    () =>
      sheets.map((s) => ({
        sheet: s,
        ...quickUps({ ...inputs, customSheet: null, sheetId: s.id }, resolveSheet({ ...inputs, customSheet: null, sheetId: s.id }, sheets.filter((x) => !x.builtin)), rounding),
      })),
    [sheets, inputs, rounding],
  );
  const group = (g: LibrarySheet['group']) => rows.filter((r) => r.sheet.group === g);

  const pick = (s: LibrarySheet) => {
    applySheet(s.id);
    router.back();
  };
  const useCustom = () => {
    if (custom.width > 0 && custom.height > 0) {
      applyCustomSheet(custom);
      router.back();
    }
  };

  const renderGroup = (title: string, list: typeof rows) =>
    list.length ? (
      <View>
        <SectionLabel style={{ marginBottom: spacing.xs }}>{title}</SectionLabel>
        {list.map((r, i) => {
          const selected = !inputs.customSheet && inputs.sheetId === r.sheet.id;
          return (
            <View key={r.sheet.id}>
              <Pressable onPress={() => pick(r.sheet)} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.opt, pressed && { opacity: 0.6 }]}>
                <Text variant="item" style={{ minWidth: 64 }}>
                  {r.sheet.name}
                </Text>
                <Label style={{ flex: 1 }} >
                  {`${unit.fmtSize(r.sheet.width, r.sheet.height, false)} · ${t.pickSheet.margins} ${unit.fmt(r.sheet.marginTop)} / ${unit.fmt(r.sheet.marginSides)}`}
                </Label>
                <Text variant="label" color={r.ups ? 'ink' : 'muted'}>
                  {r.ups ? `${r.ups} · ${fmtInt(r.sheets)} ${t.pickSheet.ark}` : '—'}
                </Text>
                {selected ? (
                  <View style={[styles.tag, { backgroundColor: theme.ink }]}>
                    <Text variant="small" color="onInk">
                      {t.pickSheet.selected}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              {i < list.length - 1 ? <Hairline /> : null}
            </View>
          );
        })}
      </View>
    ) : null;

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text variant="headerTitle" style={{ fontSize: 18 }}>
            {t.pickSheet.title}
          </Text>
          <IconButton accessibilityLabel={t.common.close} onPress={() => router.back()} size={36} style={{ backgroundColor: theme.field }}>
            <CloseIcon color={theme.ink} />
          </IconButton>
        </View>
      }>
      <Label>{t.pickSheet.hint(calc.formatName, fmtInt(inputs.quantity))}</Label>
      {renderGroup(t.pickSheet.offset, group('offset'))}
      {renderGroup(t.pickSheet.digital, group('digital'))}
      <View>
        <SectionLabel style={{ marginBottom: spacing.sm }}>{t.pickSheet.custom}</SectionLabel>
        <View style={styles.customRow}>
          <NumberField value={unit.toDisplay(custom.width)} onChange={(v) => setCustom({ ...custom, width: unit.fromDisplay(v) })} decimals={unit.digits} size="md" placeholder={t.pickSheet.w} caption={`${t.pickSheet.w} ${unit.unit}`} accessibilityLabel={`${t.pickSheet.w} ${unit.unit}`} format={(n) => (n ? String(n).replace('.', ',') : '')} />
          <Text variant="value" color="muted" style={{ marginTop: 11 }}>
            ×
          </Text>
          <NumberField value={unit.toDisplay(custom.height)} onChange={(v) => setCustom({ ...custom, height: unit.fromDisplay(v) })} decimals={unit.digits} size="md" placeholder={t.pickSheet.h} caption={`${t.pickSheet.h} ${unit.unit}`} accessibilityLabel={`${t.pickSheet.h} ${unit.unit}`} format={(n) => (n ? String(n).replace('.', ',') : '')} />
          <NumberField value={unit.toDisplay(custom.marginTop)} onChange={(v) => setCustom({ ...custom, marginTop: unit.fromDisplay(v) })} decimals={unit.digits} size="md" caption={`${t.pickSheet.marginTop} ${unit.unit}`} accessibilityLabel={`${t.pickSheet.marginTop} ${unit.unit}`} />
          <NumberField value={unit.toDisplay(custom.marginSides)} onChange={(v) => setCustom({ ...custom, marginSides: unit.fromDisplay(v) })} decimals={unit.digits} size="md" caption={`${t.pickSheet.marginSides} ${unit.unit}`} accessibilityLabel={`${t.pickSheet.marginSides} ${unit.unit}`} />
        </View>
      </View>
      <PillButton title={t.pickSheet.useCustom} onPress={useCustom} disabled={!(custom.width > 0 && custom.height > 0)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: spacing.xs },
  tag: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  customRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
});

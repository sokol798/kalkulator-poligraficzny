import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookmarkIcon, DownloadIcon, ShareIcon } from '@/components/icons';
import { SheetPreview } from '@/components/sheet-preview';
import { TextField } from '@/components/text-field';
import { Card, IconButton, KV, Label, PillButton, Screen, StackHeader, Text } from '@/components/ui';
import { layoutLabel } from '@/features/calculator/calculator-screen';
import { summaryOf } from '@/features/calculator/use-auto-save';
import { useCalculation } from '@/hooks/use-calculation';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { exportCardPdf, shareCard } from '@/lib/export';
import { fmtDate, fmtDec, fmtInt } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function CardScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const inputs = useAppStore((s) => s.inputs);
  const { saveCurrent, toggleStar, renameEntry, newCalculation } = useAppStore();
  const entry = useAppStore((s) => (s.currentEntryId ? s.history.find((h) => h.id === s.currentEntryId) : undefined));
  const calc = useCalculation();
  const [name, setName] = useState(entry?.name ?? '');
  const when = entry?.createdAt ?? Date.now();

  const persistName = () => {
    const id = saveCurrent(summaryOf(calc), { name });
    renameEntry(id, name);
  };
  const onStar = () => {
    const id = saveCurrent(summaryOf(calc), entry ? { name } : { name, star: true });
    if (entry) toggleStar(id);
  };
  const ensureSaved = () => saveCurrent(summaryOf(calc), { name });

  const best = calc.imposition.best;
  const layoutText = best ? `${calc.ups} · ${best.columns} × ${best.rows} · ${layoutLabel(best.strategy)}` : '—';

  return (
    <Screen
      header={
        <StackHeader
          title={t.card.title}
          right={
            <IconButton accessibilityLabel={t.calc.save} onPress={onStar}>
              <BookmarkIcon color={theme.ink} filled={!!entry?.starred} />
            </IconButton>
          }
        />
      }>
      <Card style={{ gap: 14 }}>
        <View style={{ gap: spacing.xs }}>
          <Label>{t.card.name}</Label>
          <TextField value={name} onChangeText={setName} onBlur={persistName} placeholder={t.history.untitled(calc.formatName)} accessibilityLabel={t.card.name} />
        </View>
        <View style={styles.top}>
          <SheetPreview result={calc.imposition} maxWidth={150} maxHeight={210} numbered />
          <View style={{ flex: 1, gap: spacing.md }}>
            <View>
              <Label>{t.card.sheets(calc.sheet.name)}</Label>
              <Text variant="heroSmall">{calc.ups ? fmtInt(calc.grossSheets) : '—'}</Text>
            </View>
            <Stat label={t.card.quantity} value={`${fmtInt(inputs.quantity)} ${t.common.pcs}`} />
            <Stat label={t.card.lastSheet} value={calc.ups ? `${calc.lastSheetPercent} %` : '—'} />
            <Stat label={t.card.paper} value={`${inputs.grammage} g/m² · ${fmtDec(calc.totalWeightKg, 1)} kg`} />
            {calc.cost != null ? <Stat label={t.card.cost} value={`${fmtDec(calc.cost, 2)} zł`} /> : null}
          </View>
        </View>
      </Card>

      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <KV label={t.card.netFormat} value={`${unit.fmtSize(inputs.width, inputs.height)} (${calc.formatName})`} />
        <KV label={t.card.withBleed(unit.fmtWithUnit(inputs.bleed))} value={unit.fmtSize(calc.itemWithBleed.width, calc.itemWithBleed.height)} />
        <KV label={t.card.sheetMargins} value={`${calc.sheet.name} ${unit.fmtSize(calc.sheet.size.width, calc.sheet.size.height, false)} · ${unit.fmt(calc.sheet.marginTop)} / ${unit.fmtWithUnit(calc.sheet.marginSides)}`} />
        <KV label={t.card.layout} value={layoutText} />
        <KV label={t.card.utilization} value={`${calc.utilization} %`} />
        {calc.wasteSheets > 0 ? <KV label={`${t.card.waste} (${inputs.wastePercent} %)`} value={`${fmtInt(calc.sheets)} + ${fmtInt(calc.wasteSheets)} = ${fmtInt(calc.grossSheets)} ark.`} /> : null}
        <KV label={t.card.sheetsWeight(calc.grossSheets, fmtDec(calc.sheetWeightG, 1))} value={`${fmtDec(calc.totalWeightKg, 1)} kg`} />
        {calc.cost != null ? <KV label={`${t.card.cost} (${fmtInt(calc.grossSheets)} × ${fmtDec(inputs.pricePerSheet, 2)} zł)`} value={`${fmtDec(calc.cost, 2)} zł`} /> : null}
        <KV label={t.card.pieceWeight} value={`${fmtDec(calc.pieceWeightG, 1)} g / ${fmtDec(calc.runWeightKg, 1)} kg`} />
        <KV label={t.card.date} value={fmtDate(when)} last />
      </Card>

      <View style={styles.actions}>
        <PillButton kind="secondary" title={t.card.pdf} icon={<DownloadIcon color={theme.ink} />} style={{ flex: 1 }} onPress={() => { ensureSaved(); void exportCardPdf(name, inputs, calc); }} />
        <PillButton kind="secondary" title={t.card.share} icon={<ShareIcon color={theme.ink} />} style={{ flex: 1 }} onPress={() => { ensureSaved(); void shareCard(name, inputs, calc); }} />
      </View>

      <PillButton
        title={t.card.newCalc}
        onPress={() => {
          newCalculation();
          router.dismissAll();
          router.replace('/');
        }}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Label>{label}</Label>
      <Text variant="value">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: spacing.sm },
});

import { PRODUCT_PRESETS, SHEET_FORMATS, formatSize, matchFormatName, round, type Orientation } from '@printcalc/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/number-field';
import { SheetPreview } from '@/components/sheet-preview';
import { SizeField } from '@/components/size-field';
import { Button, Card, Notice, ResultRow, Row, Screen, SectionTitle, Segmented, StatTile, SwitchRow, Text } from '@/components/ui';
import { useCalculation } from '@/hooks/use-calculation';
import { t } from '@/i18n/pl';
import { useCalculatorStore } from '@/store/calculator-store';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';
import { useState } from 'react';

type OrientationChoice = 'auto' | Orientation;

export function CalculatorScreen() {
  const theme = useTheme();
  const inputs = useCalculatorStore((s) => s.inputs);
  const { set, setItem, setSheet, swapItem, swapSheet, newCalculation } = useCalculatorStore();
  const calc = useCalculation();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const best = calc.imposition.best;
  const candidates = calc.imposition.candidates;
  const shown = candidates[Math.min(selectedIdx, Math.max(0, candidates.length - 1))] ?? best;

  const orientation: OrientationChoice = inputs.forceOrientation ?? 'auto';
  const sheetName = matchFormatName(inputs.sheet);

  return (
    <Screen title={t.app.title}>
      {/* ——— Użytek ——— */}
      <Card>
        <SectionTitle>{t.product.section}</SectionTitle>
        <SizeField
          label={`${t.product.width} / ${t.product.height}`}
          presetLabel={t.product.preset}
          size={inputs.item}
          presetId={inputs.itemPresetId}
          presets={PRODUCT_PRESETS}
          onChange={(size, id) => setItem(size, id)}
          onSwap={swapItem}
        />
        <Row label={t.product.bleed} hint="na każdą krawędź">
          <NumberField value={inputs.bleed} onChange={(v) => set('bleed', v)} unit="mm" decimals={1} max={50} />
        </Row>
        <Row label={t.product.gutter} hint="między użytkami">
          <NumberField value={inputs.gutter} onChange={(v) => set('gutter', v)} unit="mm" decimals={1} max={100} />
        </Row>
        <Row label={t.product.quantity}>
          <NumberField value={inputs.quantity} onChange={(v) => set('quantity', v)} unit={t.common.pcs} decimals={0} width={120} />
        </Row>
        <Row label={t.product.versions} hint="różnych projektów na arkuszu">
          <NumberField value={inputs.versions} onChange={(v) => set('versions', Math.max(1, v))} decimals={0} min={1} max={500} />
        </Row>
      </Card>

      {/* ——— Arkusz ——— */}
      <Card>
        <SectionTitle>{t.sheet.section}</SectionTitle>
        <SizeField
          label="Wymiar arkusza"
          presetLabel={t.sheet.preset}
          size={inputs.sheet}
          presetId={inputs.sheetPresetId}
          presets={SHEET_FORMATS}
          onChange={(size, id) => setSheet(size, id)}
          onSwap={swapSheet}
        />
        <Row label={t.sheet.gripper} hint="margines nie do zadruku">
          <NumberField value={inputs.gripper} onChange={(v) => set('gripper', v)} unit="mm" decimals={1} max={100} />
        </Row>
        <Row label={t.sheet.marginSide}>
          <NumberField value={inputs.marginSide} onChange={(v) => set('marginSide', v)} unit="mm" decimals={1} max={100} />
        </Row>
        <Row label={t.sheet.marginBottom}>
          <NumberField value={inputs.marginBottom} onChange={(v) => set('marginBottom', v)} unit="mm" decimals={1} max={100} />
        </Row>
        <Row label={t.sheet.orientation}>
          <Segmented<OrientationChoice>
            value={orientation}
            onChange={(v) => set('forceOrientation', v === 'auto' ? null : v)}
            options={[
              { value: 'auto', label: t.sheet.orientationAuto },
              { value: 'portrait', label: t.sheet.orientationPortrait },
              { value: 'landscape', label: t.sheet.orientationLandscape },
            ]}
          />
        </Row>
        <SwitchRow label={t.sheet.allowMixed} value={inputs.allowMixed} onChange={(v) => set('allowMixed', v)} />
      </Card>

      {/* ——— Wynik: użytki ——— */}
      <Card>
        <SectionTitle right={<Button title="Nowe obliczenie" kind="ghost" small onPress={() => { newCalculation(); setSelectedIdx(0); }} />}>
          {t.result.section}
        </SectionTitle>
        {best ? (
          <>
            <View style={styles.tiles}>
              <StatTile label={t.result.ups} value={best.ups} unit={t.common.pcs} tone="accent" />
              <StatTile label={t.result.grossSheets} value={calc.sheets.grossSheets} unit={t.common.sheets} />
              <StatTile label={t.result.weight} value={round(calc.paper.totalWeightKg, 1)} unit={t.common.kg} />
            </View>

            <SheetPreview result={calc.imposition} layout={shown ?? best} />

            <ResultRow label={t.result.layout} value={`${t.result.strategy[(shown ?? best).strategy]} · ${(shown ?? best).columns} × ${(shown ?? best).rows}`} />
            <ResultRow label={t.result.utilization} value={round((shown ?? best).utilization * 100, 1)} unit="%" />
            <ResultRow label={t.result.printable} value={formatSize(calc.imposition.printableArea)} />
            <ResultRow label={t.result.itemBleed} value={formatSize(calc.imposition.itemWithBleed)} />
            <ResultRow label={t.result.pitch} value={formatSize(calc.imposition.pitch)} />
            <ResultRow label={t.result.leftover} value={`${round((shown ?? best).leftover.right, 1)} / ${round((shown ?? best).leftover.bottom, 1)}`} unit="mm" />
            {sheetName ? <ResultRow label="Rozpoznany format arkusza" value={sheetName} /> : null}

            {candidates.length > 1 ? (
              <View style={styles.alternatives}>
                <Text variant="section" color="textMuted">
                  {t.result.alternatives}
                </Text>
                <View style={styles.chips}>
                  {candidates.slice(0, 8).map((c, i) => {
                    const active = c === (shown ?? best);
                    return (
                      <Pressable
                        key={`${c.strategy}-${i}`}
                        onPress={() => setSelectedIdx(i)}
                        style={[styles.chip, { backgroundColor: active ? theme.accentSoft : theme.surfaceAlt, borderColor: active ? theme.accent : theme.border }]}>
                        <Text variant="label" color={active ? 'accent' : 'text'}>
                          {`${c.ups} szt.`}
                        </Text>
                        <Text variant="small" color="textMuted">
                          {`${t.result.strategy[c.strategy]} · ${round(c.utilization * 100, 0)} %`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <Notice tone="danger">{t.result.noFit}</Notice>
        )}
      </Card>

      {/* ——— Arkusze i papier ——— */}
      <Card>
        <SectionTitle>{t.paper.section}</SectionTitle>
        <Row label={t.paper.wastePercent} hint="naddatek technologiczny">
          <NumberField value={inputs.wastePercent} onChange={(v) => set('wastePercent', v)} unit="%" decimals={1} max={100} />
        </Row>
        <Row label={t.paper.wasteMin}>
          <NumberField value={inputs.wasteMinSheets} onChange={(v) => set('wasteMinSheets', v)} unit={t.common.sheets} decimals={0} />
        </Row>
        <Row label={t.paper.parentPerSheet} hint="np. B1 → 4 × B3">
          <NumberField value={inputs.parentPerSheet} onChange={(v) => set('parentPerSheet', Math.max(1, v))} decimals={0} min={1} max={64} />
        </Row>
        <Row label={t.paper.grammage}>
          <NumberField value={inputs.grammage} onChange={(v) => set('grammage', v)} unit={t.common.gsm} decimals={0} max={1000} />
        </Row>
        <Row label={t.paper.pricePerKg} hint="0 = pomiń">
          <NumberField value={inputs.pricePerKg} onChange={(v) => set('pricePerKg', v)} unit="zł" decimals={2} />
        </Row>
        <Row label={t.paper.pricePerThousand} hint="używana, gdy brak ceny za kg">
          <NumberField value={inputs.pricePerThousand} onChange={(v) => set('pricePerThousand', v)} unit="zł" decimals={2} width={110} />
        </Row>

        <View style={{ height: spacing.md }} />
        <ResultRow label={t.result.netSheets} value={calc.sheets.netSheets} unit={t.common.sheets} />
        <ResultRow label={t.result.wasteSheets} value={calc.sheets.wasteSheets} unit={t.common.sheets} />
        <ResultRow label={t.result.grossSheets} value={calc.sheets.grossSheets} unit={t.common.sheets} emphasis />
        {calc.sheets.parentSheets != null ? <ResultRow label={t.result.parentSheets} value={calc.sheets.parentSheets} unit={t.common.sheets} /> : null}
        <ResultRow label={t.result.produced} value={calc.sheets.producedQuantity} unit={t.common.pcs} />
        <ResultRow label={t.result.overrun} value={calc.sheets.overrun} unit={t.common.pcs} tone={calc.sheets.overrun > 0 ? 'warning' : undefined} />
        <ResultRow label={t.result.sheetWeight} value={round(calc.paper.sheetWeightG, 2)} unit={t.common.g} />
        <ResultRow label={t.result.reamWeight} value={round(calc.paper.reamWeightKg, 2)} unit={t.common.kg} />
        <ResultRow label={t.result.weight} value={round(calc.paper.totalWeightKg, 2)} unit={t.common.kg} emphasis />
        {calc.paper.cost != null ? <ResultRow label={t.result.cost} value={calc.paper.cost.toFixed(2)} unit="zł" emphasis /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  alternatives: { marginTop: spacing.md, gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, minWidth: 120 },
});

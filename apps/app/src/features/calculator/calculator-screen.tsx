import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookmarkIcon, ChevronDown, ChevronRight, GearIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { QuantityDrum, stepQuantity } from '@/components/quantity-drum';
import { SheetPreview } from '@/components/sheet-preview';
import { Card, Chip, IconButton, Label, PillButton, Screen, TabHeader, Text } from '@/components/ui';
import { FunctionsMenu, MenuTitle } from '@/features/calculator/functions-menu';
import { summaryOf } from '@/features/calculator/use-auto-save';
import { useCalculation } from '@/hooks/use-calculation';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { fmtDec, fmtInt } from '@/lib/format';
import { BLEED_OPTIONS, MARGIN_TOP_OPTIONS, QUANTITY_MAX, QUICK_FORMAT_IDS, QUICK_GRAMMAGES, QUICK_SHEET_IDS, WASTE_OPTIONS } from '@/lib/library-data';
import { findFormat, findSheet, useAppStore } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function CalculatorScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const inputs = useAppStore((s) => s.inputs);
  const settings = useAppStore((s) => s.settings);
  const myFormats = useAppStore((s) => s.formats);
  const mySheets = useAppStore((s) => s.sheets);
  const { setInput, setSize, applyFormat, applySheet, saveCurrent, toggleStar } = useAppStore();
  const currentEntryId = useAppStore((s) => s.currentEntryId);
  const starred = useAppStore((s) => (s.currentEntryId ? s.history.find((h) => h.id === s.currentEntryId)?.starred : false)) ?? false;
  const calc = useCalculation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [computed, setComputed] = useState(false);
  const firstRender = useRef(true);

  // Wynik pokazujemy dopiero po „Oblicz”; każda zmiana danych chowa go ponownie.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setComputed(false);
  }, [inputs]);

  const compute = () => {
    setComputed(true);
    if (settings.autoSave && calc.ups > 0) saveCurrent(summaryOf(calc));
  };

  const quickFormats = QUICK_FORMAT_IDS.map((id) => findFormat(id, myFormats)!).filter(Boolean);
  const selectedFormat = findFormat(inputs.formatId, myFormats);
  const showExtraFormat = selectedFormat && !QUICK_FORMAT_IDS.includes(selectedFormat.id);

  const quickSheets = QUICK_SHEET_IDS.map((id) => findSheet(id, mySheets)!).filter(Boolean);
  const selectedSheet = inputs.customSheet ? null : findSheet(inputs.sheetId, mySheets);
  const showExtraSheet = inputs.customSheet || (selectedSheet && !QUICK_SHEET_IDS.includes(selectedSheet.id));

  const customGrammage = !QUICK_GRAMMAGES.includes(inputs.grammage);
  const customBleed = !BLEED_OPTIONS.includes(inputs.bleed);
  const marginTop = calc.sheet.marginTop;
  const customMargin = !MARGIN_TOP_OPTIONS.includes(marginTop);
  const customWaste = !WASTE_OPTIONS.includes(inputs.wastePercent);

  const onSave = () => {
    const id = saveCurrent(summaryOf(calc), currentEntryId ? undefined : { star: true });
    if (currentEntryId) toggleStar(id);
  };
  const step = (dir: 1 | -1) => setInput('quantity', Math.min(QUANTITY_MAX, stepQuantity(inputs.quantity, dir)));

  /** Pole „inne” w rzędzie chipów. */
  const otherField = (opts: { value: number; isCustom: boolean; onChange: (v: number) => void; decimals: number; max?: number; label: string; width?: number }) => (
    <NumberField
      value={opts.isCustom ? opts.value : 0}
      onChange={opts.onChange}
      decimals={opts.decimals}
      max={opts.max}
      size="sm"
      pill
      placeholder={t.calc.otherPl}
      accessibilityLabel={`${opts.label}: ${t.calc.otherPl}`}
      format={(n) => (opts.isCustom && n > 0 ? String(Math.round(n * 100) / 100).replace('.', ',') : '')}
      width={opts.width ?? 64}
    />
  );

  return (
    <Screen
      footer
      header={
        <TabHeader
          title={<MenuTitle title={t.calc.title} open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />}
          right={
            <IconButton accessibilityLabel={t.settings.title} onPress={() => router.push('/settings')}>
              <GearIcon color={theme.ink} />
            </IconButton>
          }
        />
      }>
      {menuOpen ? <FunctionsMenu onClose={() => setMenuOpen(false)} onNewCalculation={() => useAppStore.getState().newCalculation()} cardDisabled={!calc.ups} /> : null}

      {/* Format użytku */}
      <Card>
        <Label>{t.calc.format}</Label>
        <View style={styles.chips}>
          {quickFormats.map((f) => (
            <Chip key={f.id} label={f.name} on={inputs.formatId === f.id} onPress={() => applyFormat(f)} />
          ))}
          {showExtraFormat && selectedFormat ? <Chip label={selectedFormat.name} on onPress={() => router.push('/pick-format')} /> : null}
          <Chip label={t.calc.more} dashed onPress={() => router.push('/pick-format')} icon={<ChevronDown color={theme.ink} />} style={{ marginLeft: 'auto' }} />
        </View>
        <View style={styles.sizeRow}>
          <NumberField value={unit.toDisplay(inputs.width)} onChange={(v) => setSize(unit.fromDisplay(v), inputs.height)} decimals={unit.digits} accessibilityLabel={`${t.calc.width} ${unit.unit}`} caption={`${t.calc.width} ${unit.unit}`} />
          <Text variant="value" color="muted" style={styles.times}>
            ×
          </Text>
          <NumberField value={unit.toDisplay(inputs.height)} onChange={(v) => setSize(inputs.width, unit.fromDisplay(v))} decimals={unit.digits} accessibilityLabel={`${t.calc.height} ${unit.unit}`} caption={`${t.calc.height} ${unit.unit}`} />
        </View>
      </Card>

      {/* Nakład – bęben */}
      <Card>
        <View style={styles.between}>
          <Label>{t.calc.quantity}</Label>
          <Label style={{ fontSize: 11 }}>{t.calc.quantityMax}</Label>
        </View>
        <View style={styles.stepper}>
          <StepButton label="−" onPress={() => step(-1)} accessibilityLabel={t.calc.less} />
          <NumberField value={inputs.quantity} onChange={(v) => setInput('quantity', Math.min(QUANTITY_MAX, v))} decimals={0} max={QUANTITY_MAX} size="lg" format={fmtInt} accessibilityLabel={t.calc.quantity} />
          <StepButton label="+" onPress={() => step(1)} accessibilityLabel={t.calc.moreQty} />
        </View>
        <QuantityDrum value={inputs.quantity} onChange={(q) => setInput('quantity', q)} />
      </Card>

      {/* Arkusz */}
      <Card>
        <Label>{t.calc.sheet}</Label>
        <View style={styles.chips}>
          {quickSheets.map((s) => (
            <Chip key={s.id} label={s.name} on={!inputs.customSheet && inputs.sheetId === s.id} onPress={() => applySheet(s.id)} />
          ))}
          {showExtraSheet ? <Chip label={calc.sheet.name} on onPress={() => router.push('/pick-sheet')} /> : null}
          <Chip label={t.calc.more} dashed onPress={() => router.push('/pick-sheet')} icon={<ChevronDown color={theme.ink} />} style={{ marginLeft: 'auto' }} />
        </View>
      </Card>

      {/* Papier */}
      <Card>
        <Label>{t.calc.paper}</Label>
        <View style={styles.chips}>
          {QUICK_GRAMMAGES.map((g) => (
            <Chip key={g} label={String(g)} on={inputs.grammage === g} onPress={() => setInput('grammage', g)} />
          ))}
          {customGrammage ? <Chip label={String(inputs.grammage)} on style={{ marginLeft: 'auto' }} /> : null}
          {otherField({ value: inputs.grammage, isCustom: false, onChange: (v) => setInput('grammage', v), decimals: 0, max: 1000, label: t.calc.paper, width: 72 })}
        </View>
      </Card>

      {/* Spady | Marginesy */}
      <View style={styles.twoCol}>
        <Card style={styles.col}>
          <Label>{t.calc.bleed}</Label>
          <View style={styles.chips}>
            {BLEED_OPTIONS.map((b) => (
              <Chip key={b} small label={unit.fmt(b)} on={inputs.bleed === b} onPress={() => setInput('bleed', b)} />
            ))}
            {otherField({ value: unit.toDisplay(inputs.bleed), isCustom: customBleed, onChange: (v) => setInput('bleed', unit.fromDisplay(v)), decimals: unit.digits, max: 50, label: t.calc.bleed })}
          </View>
        </Card>
        <Card style={styles.col}>
          <Label>{t.calc.margins}</Label>
          <View style={styles.chips}>
            {MARGIN_TOP_OPTIONS.map((m) => (
              <Chip key={m} small label={unit.fmt(m)} on={marginTop === m} onPress={() => setInput('marginTop', m)} />
            ))}
            {otherField({ value: unit.toDisplay(marginTop), isCustom: customMargin, onChange: (v) => setInput('marginTop', unit.fromDisplay(v)), decimals: unit.digits, max: 100, label: t.calc.margins })}
          </View>
          <Label style={{ fontSize: 11 }}>{t.calc.marginsSides(unit.fmtWithUnit(calc.sheet.marginSides))}</Label>
        </Card>
      </View>

      {/* Naddatek (opcjonalny) */}
      {settings.wasteEnabled ? (
        <Card>
          <Label>{t.calc.waste}</Label>
          <View style={styles.chips}>
            {WASTE_OPTIONS.map((w) => (
              <Chip key={w} small label={`${w} %`} on={inputs.wastePercent === w} onPress={() => setInput('wastePercent', w)} />
            ))}
            {otherField({ value: inputs.wastePercent, isCustom: customWaste, onChange: (v) => setInput('wastePercent', v), decimals: 1, max: 100, label: t.calc.waste })}
          </View>
        </Card>
      ) : null}

      {/* Złotówki – cena za arkusz (opcjonalna) */}
      {settings.priceEnabled ? (
        <Card style={styles.between}>
          <View>
            <Label>{t.calc.priceCard}</Label>
            <Label style={{ fontSize: 11 }}>{t.calc.priceHint}</Label>
          </View>
          <View style={styles.priceRow}>
            <NumberField value={inputs.pricePerSheet} onChange={(v) => setInput('pricePerSheet', v)} decimals={2} size="md" placeholder={t.calc.pricePlaceholder} accessibilityLabel={t.calc.price} format={(n) => (n > 0 ? n.toFixed(2).replace('.', ',') : '')} width={104} />
            <Label>{t.settings.pln}</Label>
          </View>
        </Card>
      ) : null}

      {/* Wynik – po kliknięciu „Oblicz” */}
      {computed ? (
        <Card>
          <View style={styles.resultRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Label>{t.calc.youNeed}</Label>
              <Text variant="hero" color={calc.ups ? 'ink' : 'muted'}>
                {calc.ups ? fmtInt(calc.grossSheets) : '—'}
              </Text>
              {calc.ups ? (
                <>
                  <Text variant="body">
                    {t.calc.sheetsOf(calc.sheet.name)} <Label>{t.calc.perSheet(calc.ups, calc.utilization)}</Label>
                  </Text>
                  <Text variant="body">
                    {t.calc.paperWeight(fmtDec(calc.totalWeightKg, 1))} <Label>{t.calc.perPiece(fmtDec(calc.pieceWeightG, 1), fmtDec(calc.runWeightKg, 1))}</Label>
                  </Text>
                  {calc.wasteSheets > 0 || calc.cost != null ? (
                    <Text variant="body">
                      {calc.cost != null ? t.calc.cost(fmtDec(calc.cost, 2)) : ''}
                      {calc.wasteSheets > 0 ? <Label>{`${calc.cost != null ? ' · ' : ''}${t.calc.plusWaste(fmtInt(calc.wasteSheets))}`}</Label> : null}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text variant="label" color="danger">
                  {t.calc.noFit}
                </Text>
              )}
            </View>
            <SheetPreview result={calc.imposition} maxWidth={86} maxHeight={120} onPress={() => router.push('/card')} accessibilityLabel={t.calc.preview} />
          </View>
        </Card>
      ) : null}

      <View style={styles.actions}>
        {computed ? (
          <>
            <PillButton title={t.calc.card} onPress={() => router.push('/card')} icon={<ChevronRight color={theme.onInk} />} style={{ flex: 1 }} disabled={!calc.ups} />
            <IconButton accessibilityLabel={starred ? t.calc.saved : t.calc.save} onPress={onSave} bordered size={50}>
              <BookmarkIcon color={theme.ink} filled={starred} />
            </IconButton>
          </>
        ) : (
          <PillButton title={t.calc.compute} onPress={compute} style={{ flex: 1 }} />
        )}
      </View>
    </Screen>
  );
}

function StepButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel: string }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.step, { backgroundColor: theme.field, opacity: pressed ? 0.7 : 1 }]}>
      <Text variant="input">{label}</Text>
    </Pressable>
  );
}

/** Opis układu najlepszego wariantu (do karty zlecenia). */
export function layoutLabel(strategy: 'grid-portrait' | 'grid-landscape' | 'mixed'): string {
  return strategy === 'mixed' ? t.calc.layoutMixed : strategy === 'grid-portrait' ? t.calc.layoutPortrait : t.calc.layoutLandscape;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  sizeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  times: { width: 20, textAlign: 'center', marginTop: 13 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  step: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  twoCol: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, minWidth: 0 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});

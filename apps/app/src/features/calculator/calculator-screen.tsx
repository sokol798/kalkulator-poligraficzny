import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookmarkIcon, ChevronDown, ChevronRight, GearIcon } from '@/components/icons';
import { FunctionsMenu, MenuTitle } from '@/features/calculator/functions-menu';
import { NumberField } from '@/components/number-field';
import { SheetPreview } from '@/components/sheet-preview';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { QuantityDrum, stepQuantity } from '@/components/quantity-drum';
import { Card, Chip, IconButton, Label, PillButton, Screen, TabHeader, Text } from '@/components/ui';
import { summaryOf, useAutoSave } from '@/features/calculator/use-auto-save';
import { useCalculation } from '@/hooks/use-calculation';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { fmtDec, fmtInt } from '@/lib/format';
import { BUILTIN_FORMATS, BUILTIN_SHEETS, QUANTITY_MAX, QUICK_FORMAT_IDS, QUICK_GRAMMAGES, QUICK_SHEET_IDS, WASTE_OPTIONS } from '@/lib/library-data';
import { findFormat, findSheet, useAppStore } from '@/store/app-store';
import { layout, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';
import { Pressable } from 'react-native';

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
  useAutoSave(calc);
  const [customGrammage, setCustomGrammage] = useState(!QUICK_GRAMMAGES.includes(inputs.grammage));
  const [menuOpen, setMenuOpen] = useState(false);

  const quickFormats = QUICK_FORMAT_IDS.map((id) => findFormat(id, myFormats)!).filter(Boolean);
  const selectedFormat = findFormat(inputs.formatId, myFormats);
  const showExtraFormat = selectedFormat && !QUICK_FORMAT_IDS.includes(selectedFormat.id);

  const quickSheets = QUICK_SHEET_IDS.map((id) => findSheet(id, mySheets)!).filter(Boolean);
  const selectedSheet = inputs.customSheet ? null : findSheet(inputs.sheetId, mySheets);
  const showExtraSheet = inputs.customSheet || (selectedSheet && !QUICK_SHEET_IDS.includes(selectedSheet.id));

  const onSave = () => {
    const id = saveCurrent(summaryOf(calc), currentEntryId ? undefined : { star: true });
    if (currentEntryId) toggleStar(id);
  };

  const step = (dir: 1 | -1) => setInput('quantity', Math.min(QUANTITY_MAX, stepQuantity(inputs.quantity, dir)));
  const customWaste = !WASTE_OPTIONS.includes(inputs.wastePercent);

  return (
    <Screen
      bottomInset={TAB_BAR_HEIGHT + spacing.md}
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
      {menuOpen ? (
        <FunctionsMenu
          onClose={() => setMenuOpen(false)}
          onNewCalculation={() => {
            useAppStore.getState().newCalculation();
            setCustomGrammage(false);
          }}
          cardDisabled={!calc.ups}
        />
      ) : null}
      {/* Format użytku */}
      <Card>
        <View style={styles.chips}>
          {quickFormats.map((f) => (
            <Chip key={f.id} label={f.name} on={inputs.formatId === f.id} onPress={() => applyFormat(f)} />
          ))}
          {showExtraFormat && selectedFormat ? <Chip label={selectedFormat.name} on onPress={() => router.push('/pick-format')} /> : null}
          <Chip label={t.calc.more} dashed onPress={() => router.push('/pick-format')} icon={<ChevronDown color={theme.ink} />} />
        </View>
        <View style={styles.sizeRow}>
          <NumberField
            value={unit.toDisplay(inputs.width)}
            onChange={(v) => setSize(unit.fromDisplay(v), inputs.height)}
            decimals={unit.digits}
            accessibilityLabel={`${t.calc.width} ${unit.unit}`}
            caption={`${t.calc.width} ${unit.unit}`}
          />
          <Text variant="value" color="muted" style={styles.times}>
            ×
          </Text>
          <NumberField
            value={unit.toDisplay(inputs.height)}
            onChange={(v) => setSize(inputs.width, unit.fromDisplay(v))}
            decimals={unit.digits}
            accessibilityLabel={`${t.calc.height} ${unit.unit}`}
            caption={`${t.calc.height} ${unit.unit}`}
          />
        </View>
      </Card>

      {/* Nakład */}
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
            <Chip key={s.id} small label={s.name} on={!inputs.customSheet && inputs.sheetId === s.id} onPress={() => applySheet(s.id)} />
          ))}
          {showExtraSheet ? <Chip small label={calc.sheet.name} on onPress={() => router.push('/pick-sheet')} /> : null}
          <Chip small label={t.calc.more} dashed onPress={() => router.push('/pick-sheet')} icon={<ChevronDown color={theme.ink} />} />
        </View>
      </Card>

      {/* Papier */}
      <Card style={styles.paperCard}>
        <Label>{t.calc.paper}</Label>
        <View style={styles.chips}>
          {QUICK_GRAMMAGES.map((g) => (
            <Chip
              key={g}
              small
              label={String(g)}
              on={!customGrammage && inputs.grammage === g}
              onPress={() => {
                setCustomGrammage(false);
                setInput('grammage', g);
              }}
            />
          ))}
          <NumberField
            value={customGrammage ? inputs.grammage : 0}
            onChange={(v) => {
              setCustomGrammage(true);
              setInput('grammage', v);
            }}
            decimals={0}
            size="sm"
            pill
            placeholder={t.calc.other}
            accessibilityLabel={`${t.calc.paper} ${t.calc.other}`}
            format={(n) => (customGrammage && n > 0 ? String(n) : '')}
            width={64}
          />
        </View>
      </Card>

      {settings.wasteEnabled || settings.priceEnabled ? (
        <Card>
          {settings.wasteEnabled ? (
            <>
              <Label>{t.calc.waste}</Label>
              <View style={styles.chips}>
                {WASTE_OPTIONS.map((w) => (
                  <Chip key={w} small label={`${w} %`} on={!customWaste && inputs.wastePercent === w} onPress={() => setInput('wastePercent', w)} />
                ))}
                <NumberField value={customWaste ? inputs.wastePercent : 0} onChange={(v) => setInput('wastePercent', v)} decimals={1} max={100} size="sm" pill placeholder={t.calc.wasteOther} accessibilityLabel={`${t.calc.waste} ${t.calc.wasteOther}`} format={(n) => (customWaste && n > 0 ? String(n).replace('.', ',') : '')} width={64} />
              </View>
            </>
          ) : null}
          {settings.priceEnabled ? (
            <View style={[styles.between, { marginTop: settings.wasteEnabled ? spacing.sm : 0 }]}>
              <Label>{t.calc.price}</Label>
              <View style={styles.priceRow}>
                <NumberField value={inputs.pricePerSheet} onChange={(v) => setInput('pricePerSheet', v)} decimals={2} size="md" placeholder={t.calc.pricePlaceholder} accessibilityLabel={t.calc.price} format={(n) => (n > 0 ? String(n).replace('.', ',') : '')} width={100} />
                <Label>{t.settings.pln}</Label>
              </View>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Pressable onPress={() => router.push('/settings')} accessibilityRole="link" style={styles.summaryLine}>
        <Label>{t.calc.summary(unit.fmtWithUnit(inputs.bleed), unit.fmt(calc.sheet.marginTop), unit.fmtWithUnit(calc.sheet.marginSides))}</Label>
        <Text variant="label">{t.calc.change}</Text>
      </Pressable>

      {/* Wynik */}
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

      <View style={styles.actions}>
        <PillButton title={t.calc.card} onPress={() => router.push('/card')} icon={<ChevronRight color={theme.onInk} />} style={{ flex: 1 }} disabled={!calc.ups} />
        <IconButton accessibilityLabel={starred ? t.calc.saved : t.calc.save} onPress={onSave} bordered size={50}>
          <BookmarkIcon color={theme.ink} filled={starred} />
        </IconButton>
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

/** Eksport do innych ekranów: nazwa arkusza dla id. */
export function sheetNameFor(id: string): string {
  return BUILTIN_SHEETS.find((s) => s.id === id)?.name ?? id;
}
export function formatNameFor(id: string | null): string | undefined {
  return BUILTIN_FORMATS.find((f) => f.id === id)?.name;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  sizeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  times: { width: 20, textAlign: 'center', marginTop: 13 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  step: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paperCard: { gap: spacing.sm },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, gap: spacing.md },
  resultRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});

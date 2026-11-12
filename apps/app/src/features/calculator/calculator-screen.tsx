import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BookmarkIcon, ChevronDown, ChevronRight, GearIcon } from '@/components/icons';
import { FunctionsMenu, MenuTitle } from '@/features/calculator/functions-menu';
import { NumberField } from '@/components/number-field';
import { SheetPreview } from '@/components/sheet-preview';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { Card, Chip, IconButton, Label, PillButton, Screen, Segmented, TabHeader, Text } from '@/components/ui';
import { summaryOf, useAutoSave } from '@/features/calculator/use-auto-save';
import { computeCalculation, useCalculation } from '@/hooks/use-calculation';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { fmtDec, fmtInt } from '@/lib/format';
import { BUILTIN_FORMATS, BUILTIN_SHEETS, QUICK_FORMAT_IDS, QUICK_GRAMMAGES, QUICK_SHEET_IDS } from '@/lib/library-data';
import { findFormat, findSheet, useAppStore, type OrientationChoice } from '@/store/app-store';
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

  /* Liczba użytków dla każdej orientacji (etykiety segmentów). */
  const upsBy = useMemo(() => {
    const f = (o: OrientationChoice) => computeCalculation({ ...inputs, orientation: o }, settings, mySheets, '').ups;
    return { auto: f('auto'), portrait: f('portrait'), landscape: f('landscape') };
  }, [inputs, settings, mySheets]);

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

  const step = (d: number) => setInput('quantity', Math.max(0, inputs.quantity + d));

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
          {showExtraFormat ? <Chip label={selectedFormat!.name} on onPress={() => router.push('/pick-format')} /> : null}
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

      {/* Nakład + arkusz */}
      <View style={styles.twoCol}>
        <Card style={styles.col}>
          <Label>{t.calc.quantity}</Label>
          <View style={styles.stepper}>
            <StepButton label="−" onPress={() => step(-100)} accessibilityLabel={t.calc.less} />
            <NumberField value={inputs.quantity} onChange={(v) => setInput('quantity', v)} decimals={0} size="md" format={fmtInt} accessibilityLabel={t.calc.quantity} />
            <StepButton label="+" onPress={() => step(100)} accessibilityLabel={t.calc.moreQty} />
          </View>
        </Card>
        <Card style={styles.col}>
          <Label>{t.calc.sheet}</Label>
          <View style={styles.chips}>
            {quickSheets.map((s) => (
              <Chip key={s.id} small label={s.name} on={!inputs.customSheet && inputs.sheetId === s.id} onPress={() => applySheet(s.id)} />
            ))}
            {showExtraSheet ? <Chip small label={calc.sheet.name} on onPress={() => router.push('/pick-sheet')} /> : null}
            <Chip small label={t.calc.more} dashed onPress={() => router.push('/pick-sheet')} icon={<ChevronDown color={theme.ink} />} />
          </View>
        </Card>
      </View>

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

      <Pressable onPress={() => router.push('/settings')} accessibilityRole="link" style={styles.summaryLine}>
        <Label>{t.calc.summary(unit.fmtWithUnit(inputs.bleed), unit.fmtWithUnit(calc.sheet.gripper), orientationLabel(inputs.orientation).toLowerCase())}</Label>
        <Text variant="label">{t.calc.change}</Text>
      </Pressable>

      {/* Wynik */}
      <Card>
        <View style={styles.resultRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Label>{t.calc.youNeed}</Label>
            <Text variant="hero" color={calc.ups ? 'ink' : 'muted'}>
              {calc.ups ? fmtInt(calc.sheets) : '—'}
            </Text>
            {calc.ups ? (
              <>
                <Text variant="body">
                  {t.calc.sheetsOf(calc.sheet.name)} <Label>{t.calc.perSheet(calc.ups, calc.utilization)}</Label>
                </Text>
                <Text variant="body">
                  {t.calc.paperWeight(fmtDec(calc.totalWeightKg, 1))} <Label>{t.calc.perPiece(fmtDec(calc.pieceWeightG, 1), fmtDec(calc.runWeightKg, 1))}</Label>
                </Text>
              </>
            ) : (
              <Text variant="label" color="danger">
                {t.calc.noFit}
              </Text>
            )}
          </View>
          <SheetPreview result={calc.imposition} maxWidth={86} maxHeight={120} onPress={() => router.push('/card')} accessibilityLabel={t.calc.preview} />
        </View>
        <Segmented<OrientationChoice>
          value={inputs.orientation}
          onChange={(v) => setInput('orientation', v)}
          options={[
            { value: 'auto', label: `${t.calc.orientationAuto} · ${upsBy.auto}` },
            { value: 'portrait', label: `${t.calc.orientationPortrait} · ${upsBy.portrait}` },
            { value: 'landscape', label: `${t.calc.orientationLandscape} · ${upsBy.landscape}` },
          ]}
        />
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

export function orientationLabel(o: OrientationChoice): string {
  return o === 'auto' ? t.calc.orientationAuto : o === 'portrait' ? t.calc.orientationPortrait : t.calc.orientationLandscape;
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
  twoCol: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, minWidth: 0 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  step: { width: 36, height: layout.control, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paperCard: { gap: spacing.sm },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, gap: spacing.md },
  resultRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});

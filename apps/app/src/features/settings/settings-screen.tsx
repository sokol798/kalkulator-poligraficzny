import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import { ChevronRight } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { Card, Label, PillButton, Row, Screen, SectionLabel, Segmented, StackHeader, Text, Toggle } from '@/components/ui';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { exportHistoryCsv } from '@/lib/export';
import { BLEED_OPTIONS, MARGIN_SIDES_OPTIONS, MARGIN_TOP_OPTIONS, QUICK_GRAMMAGES, WASTE_OPTIONS } from '@/lib/library-data';
import { findSheet, useAppStore, type Rounding, type Unit } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

function confirm(message: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(message)) onOk();
    return;
  }
  Alert.alert('', message, [{ text: t.newFormat.cancel, style: 'cancel' }, { text: t.common.ok, style: 'destructive', onPress: onOk }]);
}

export function SettingsScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const s = useAppStore((x) => x.settings);
  const mySheets = useAppStore((x) => x.sheets);
  const history = useAppStore((x) => x.history);
  const { setSetting, resetSettings, clearHistory } = useAppStore();
  const defaultSheet = findSheet(s.defaultSheetId, mySheets);

  const num = (opts: number[], value: number, onChange: (v: number) => void, fmt: (n: number) => string = String, width = 176) => (
    <Segmented<string> value={String(value)} onChange={(v) => onChange(Number(v))} options={opts.map((o) => ({ value: String(o), label: fmt(o) }))} style={{ width }} />
  );

  return (
    <Screen header={<StackHeader title={t.settings.title} />}>
      {/* ——— Obliczenia ——— */}
      <SectionLabel>{t.settings.calc}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.bleed} hint={t.settings.bleedHint}>
          {num(BLEED_OPTIONS, s.bleed, (v) => setSetting('bleed', v), unit.fmt)}
        </Row>
        <Row title={t.settings.marginTop} hint={t.settings.marginTopHint}>
          {num(MARGIN_TOP_OPTIONS, s.marginTop, (v) => setSetting('marginTop', v), unit.fmt)}
        </Row>
        <Row title={t.settings.marginSides} hint={t.settings.marginSidesHint}>
          {num(MARGIN_SIDES_OPTIONS, s.marginSides, (v) => setSetting('marginSides', v), unit.fmt)}
        </Row>
        <Row title={t.settings.defaultSheet} hint={t.settings.defaultSheetHint} onPress={() => router.push({ pathname: '/(tabs)/library', params: { tab: 'sheets' } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body" color="muted">
              {defaultSheet ? `${defaultSheet.name} · ${unit.fmtSize(defaultSheet.width, defaultSheet.height, false)}` : '—'}
            </Text>
            <ChevronRight color={theme.muted} />
          </View>
        </Row>
        <Row title={t.settings.rounding} hint={t.settings.roundingHint} last>
          <Segmented<Rounding> value={s.rounding} onChange={(v) => setSetting('rounding', v)} options={[{ value: 'up', label: t.settings.roundUp }, { value: 'ten', label: t.settings.roundTen }]} style={{ width: 150 }} />
        </Row>
      </Card>

      {/* ——— Papier i koszty ——— */}
      <SectionLabel>{t.settings.paper}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.grammage} hint={t.settings.grammageHint}>
          {num(QUICK_GRAMMAGES, s.grammage, (v) => setSetting('grammage', v))}
        </Row>
        <Row title={t.settings.waste} hint={t.settings.wasteHint} last={!s.wasteEnabled && !s.priceEnabled}>
          <Toggle value={s.wasteEnabled} onChange={(v) => setSetting('wasteEnabled', v)} accessibilityLabel={t.settings.waste} />
        </Row>
        {s.wasteEnabled ? (
          <>
            <Row title={t.settings.wastePercent}>{num(WASTE_OPTIONS, s.wastePercent, (v) => setSetting('wastePercent', v), (n) => `${n} %`)}</Row>
            <Row title={t.settings.wasteMin} hint={t.common.sheets ?? 'ark.'} last={!s.priceEnabled}>
              <NumberField value={s.wasteMinSheets} onChange={(v) => setSetting('wasteMinSheets', v)} decimals={0} size="sm" accessibilityLabel={t.settings.wasteMin} width={72} />
            </Row>
          </>
        ) : null}
        <Row title={t.settings.price} hint={t.settings.priceHint} last={!s.priceEnabled}>
          <Toggle value={s.priceEnabled} onChange={(v) => setSetting('priceEnabled', v)} accessibilityLabel={t.settings.price} />
        </Row>
        {s.priceEnabled ? (
          <Row title={t.settings.pricePerSheet} hint={t.settings.pln} last>
            <NumberField value={s.pricePerSheet} onChange={(v) => setSetting('pricePerSheet', v)} decimals={2} size="sm" placeholder={t.calc.pricePlaceholder} accessibilityLabel={t.settings.pricePerSheet} format={(n) => (n > 0 ? String(n).replace('.', ',') : '')} width={88} />
          </Row>
        ) : null}
      </Card>

      {/* ——— Historia ——— */}
      <SectionLabel>{t.settings.history}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.autoSave} hint={t.settings.autoSaveHint}>
          <Toggle value={s.autoSave} onChange={(v) => setSetting('autoSave', v)} accessibilityLabel={t.settings.autoSave} />
        </Row>
        <Row title={t.settings.exportCsv} hint={`${history.length} ${t.common.entries}`} onPress={() => void exportHistoryCsv(history)}>
          <ChevronRight color={theme.muted} />
        </Row>
        <Row title={t.settings.clearHistory} hint={t.settings.clearHistoryHint} onPress={() => confirm(t.settings.clearHistoryConfirm, clearHistory)} last>
          <ChevronRight color={theme.muted} />
        </Row>
      </Card>

      {/* ——— Wyświetlanie ——— */}
      <SectionLabel>{t.settings.display}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.unit} last>
          <Segmented<Unit> value={s.unit} onChange={(v) => setSetting('unit', v)} options={[{ value: 'mm', label: t.common.mm }, { value: 'cm', label: t.common.cm }]} style={{ width: 120 }} />
        </Row>
      </Card>

      {/* ——— Pomoc ——— */}
      <SectionLabel>{t.settings.help}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.howWeCount} onPress={() => router.push('/help')}>
          <ChevronRight color={theme.muted} />
        </Row>
        <Row title={t.settings.resetSettings} onPress={() => confirm(t.settings.resetConfirm, resetSettings)} last>
          <ChevronRight color={theme.muted} />
        </Row>
      </Card>

      <Label style={{ textAlign: 'center', marginTop: spacing.sm }}>{`${t.settings.version} ${Constants.expoConfig?.version ?? '—'}`}</Label>
      <PillButton title={t.settings.done} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Screen>
  );
}

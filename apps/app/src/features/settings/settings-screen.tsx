/** Ustawienia: lista sekcji; każda pozycja otwiera własny ekran (jak w ustawieniach systemowych). */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import { ChevronRight } from '@/components/icons';
import { Card, Label, PillButton, Row, Screen, SectionLabel, Text, Toggle, StackHeader } from '@/components/ui';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { exportHistoryCsv } from '@/lib/export';
import { findSheet, useAppStore } from '@/store/app-store';
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

  const Value = ({ children }: { children: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text variant="body" color="muted">
        {children}
      </Text>
      <ChevronRight color={theme.muted} />
    </View>
  );
  const open = (item: string) => () => router.push(`/settings/${item}` as never);

  return (
    <Screen header={<StackHeader title={t.settings.title} />}>
      <SectionLabel>{t.settings.calc}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.bleed} onPress={open('bleed')}>
          <Value>{unit.fmtWithUnit(s.bleed)}</Value>
        </Row>
        <Row title={t.settings.margins} onPress={open('margins')}>
          <Value>{`${unit.fmt(s.marginTop)} / ${unit.fmtWithUnit(s.marginSides)}`}</Value>
        </Row>
        <Row title={t.settings.defaultSheet} onPress={() => router.push({ pathname: '/library', params: { tab: 'sheets' } })}>
          <Value>{defaultSheet ? defaultSheet.name : '—'}</Value>
        </Row>
        <Row title={t.settings.rounding} onPress={open('rounding')} last>
          <Value>{s.rounding === 'up' ? t.settings.roundUp : t.settings.roundTen}</Value>
        </Row>
      </Card>

      <SectionLabel>{t.settings.paper}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.grammage} onPress={open('grammage')}>
          <Value>{`${s.grammage} g/m²`}</Value>
        </Row>
        <Row title={t.settings.waste} onPress={open('waste')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Toggle value={s.wasteEnabled} onChange={(v) => setSetting('wasteEnabled', v)} accessibilityLabel={t.settings.waste} />
            <ChevronRight color={theme.muted} />
          </View>
        </Row>
        <Row title={t.settings.price} onPress={open('price')} last>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Toggle value={s.priceEnabled} onChange={(v) => setSetting('priceEnabled', v)} accessibilityLabel={t.settings.price} />
            <ChevronRight color={theme.muted} />
          </View>
        </Row>
      </Card>

      <SectionLabel>{t.settings.history}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.autoSave} hint={t.settings.autoSaveHint}>
          <Toggle value={s.autoSave} onChange={(v) => setSetting('autoSave', v)} accessibilityLabel={t.settings.autoSave} />
        </Row>
        <Row title={t.history.title} onPress={() => router.push('/history')}>
          <Value>{`${history.length} ${t.common.entries}`}</Value>
        </Row>
        <Row title={t.settings.exportCsv} onPress={() => void exportHistoryCsv(history)}>
          <ChevronRight color={theme.muted} />
        </Row>
        <Row title={t.settings.clearHistory} hint={t.settings.clearHistoryHint} onPress={() => confirm(t.settings.clearHistoryConfirm, clearHistory)} last>
          <ChevronRight color={theme.muted} />
        </Row>
      </Card>

      <SectionLabel>{t.settings.display}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.unit} onPress={open('unit')} last>
          <Value>{s.unit}</Value>
        </Row>
      </Card>

      <SectionLabel>{t.settings.help}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.library.title} onPress={() => router.push('/library')}>
          <ChevronRight color={theme.muted} />
        </Row>
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

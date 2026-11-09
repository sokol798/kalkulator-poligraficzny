import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';

import { ChevronRight } from '@/components/icons';
import { Card, Label, PillButton, Row, Screen, SectionLabel, Segmented, StackHeader, Text, Toggle } from '@/components/ui';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { exportHistoryCsv } from '@/lib/export';
import { BLEED_OPTIONS, GRIPPER_OPTIONS, QUICK_GRAMMAGES } from '@/lib/library-data';
import { findSheet, useAppStore, type OrientationChoice, type Rounding, type Unit } from '@/store/app-store';
import { useTheme } from '@/theme/use-theme';

export function SettingsScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const s = useAppStore((x) => x.settings);
  const mySheets = useAppStore((x) => x.sheets);
  const history = useAppStore((x) => x.history);
  const setSetting = useAppStore((x) => x.setSetting);
  const defaultSheet = findSheet(s.defaultSheetId, mySheets);

  const num = (opts: number[], value: number, onChange: (v: number) => void, fmt: (n: number) => string = String) => (
    <Segmented<string> value={String(value)} onChange={(v) => onChange(Number(v))} options={opts.map((o) => ({ value: String(o), label: fmt(o) }))} style={{ width: 176 }} />
  );

  return (
    <Screen header={<StackHeader title={t.settings.title} />}>
      <SectionLabel>{t.settings.defaults}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.bleed} hint={t.settings.bleedHint}>
          {num(BLEED_OPTIONS, s.bleed, (v) => setSetting('bleed', v))}
        </Row>
        <Row title={t.settings.gripper} hint={t.settings.gripperHint}>
          {num(GRIPPER_OPTIONS, s.gripper, (v) => setSetting('gripper', v))}
        </Row>
        <Row title={t.settings.grammage} hint={t.settings.grammageHint}>
          {num(QUICK_GRAMMAGES, s.grammage, (v) => setSetting('grammage', v))}
        </Row>
        <Row title={t.settings.defaultSheet} onPress={() => router.push({ pathname: '/(tabs)/library', params: { tab: 'sheets' } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body" color="muted">
              {defaultSheet ? `${defaultSheet.name} · ${unit.fmtSize(defaultSheet.width, defaultSheet.height, false)}` : '—'}
            </Text>
            <ChevronRight color={theme.muted} />
          </View>
        </Row>
        <Row title={t.settings.orientation} hint={t.settings.orientationHint} last>
          <Segmented<OrientationChoice>
            value={s.orientation}
            onChange={(v) => setSetting('orientation', v)}
            options={[
              { value: 'auto', label: t.calc.orientationAuto },
              { value: 'portrait', label: t.calc.orientationPortrait },
              { value: 'landscape', label: t.calc.orientationLandscape },
            ]}
            style={{ width: 196 }}
          />
        </Row>
      </Card>

      <SectionLabel>{t.settings.result}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.rounding} hint={t.settings.roundingHint}>
          <Segmented<Rounding> value={s.rounding} onChange={(v) => setSetting('rounding', v)} options={[{ value: 'up', label: t.settings.roundUp }, { value: 'ten', label: t.settings.roundTen }]} style={{ width: 150 }} />
        </Row>
        <Row title={t.settings.autoSave} hint={t.settings.autoSaveHint}>
          <Toggle value={s.autoSave} onChange={(v) => setSetting('autoSave', v)} accessibilityLabel={t.settings.autoSave} />
        </Row>
        <Row title={t.settings.unit} last>
          <Segmented<Unit> value={s.unit} onChange={(v) => setSetting('unit', v)} options={[{ value: 'mm', label: t.common.mm }, { value: 'cm', label: t.common.cm }]} style={{ width: 120 }} />
        </Row>
      </Card>

      <SectionLabel>{t.settings.help}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        <Row title={t.settings.howWeCount} onPress={() => router.push('/help')}>
          <ChevronRight color={theme.muted} />
        </Row>
        <Row title={t.settings.exportCsv} onPress={() => void exportHistoryCsv(history)} last>
          <ChevronRight color={theme.muted} />
        </Row>
      </Card>

      <Label style={{ textAlign: 'center' }}>{`${t.settings.version} ${Constants.expoConfig?.version ?? '—'}`}</Label>
      <PillButton title={t.settings.done} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Screen>
  );
}

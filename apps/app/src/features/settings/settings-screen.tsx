import Constants from 'expo-constants';

import { NumberField } from '@/components/number-field';
import { Button, Card, Row, Screen, SectionTitle, SwitchRow, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { useCalculatorStore } from '@/store/calculator-store';

export function SettingsScreen() {
  const d = useCalculatorStore((s) => s.defaults);
  const setDefault = useCalculatorStore((s) => s.setDefault);
  const resetDefaults = useCalculatorStore((s) => s.resetDefaults);

  return (
    <Screen title={t.settings.title}>
      <Card>
        <Text variant="small" color="textMuted">
          {t.settings.hint}
        </Text>
      </Card>
      <Card>
        <SectionTitle>{t.product.section}</SectionTitle>
        <Row label={t.product.bleed}>
          <NumberField value={d.bleed} onChange={(v) => setDefault('bleed', v)} unit="mm" decimals={1} />
        </Row>
        <Row label={t.product.gutter}>
          <NumberField value={d.gutter} onChange={(v) => setDefault('gutter', v)} unit="mm" decimals={1} />
        </Row>
      </Card>
      <Card>
        <SectionTitle>{t.sheet.section}</SectionTitle>
        <Row label={t.sheet.gripper}>
          <NumberField value={d.gripper} onChange={(v) => setDefault('gripper', v)} unit="mm" decimals={1} />
        </Row>
        <Row label={t.sheet.marginSide}>
          <NumberField value={d.marginSide} onChange={(v) => setDefault('marginSide', v)} unit="mm" decimals={1} />
        </Row>
        <Row label={t.sheet.marginBottom}>
          <NumberField value={d.marginBottom} onChange={(v) => setDefault('marginBottom', v)} unit="mm" decimals={1} />
        </Row>
        <SwitchRow label={t.sheet.allowMixed} value={d.allowMixed} onChange={(v) => setDefault('allowMixed', v)} />
      </Card>
      <Card>
        <SectionTitle>{t.paper.section}</SectionTitle>
        <Row label={t.paper.wastePercent}>
          <NumberField value={d.wastePercent} onChange={(v) => setDefault('wastePercent', v)} unit="%" decimals={1} />
        </Row>
        <Row label={t.paper.wasteMin}>
          <NumberField value={d.wasteMinSheets} onChange={(v) => setDefault('wasteMinSheets', v)} unit={t.common.sheets} decimals={0} />
        </Row>
        <Row label={t.paper.grammage}>
          <NumberField value={d.grammage} onChange={(v) => setDefault('grammage', v)} unit={t.common.gsm} decimals={0} />
        </Row>
      </Card>
      <Button title={t.settings.reset} onPress={resetDefaults} />
      <Card>
        <SectionTitle>{t.settings.about}</SectionTitle>
        <Text variant="small" color="textMuted">
          {`${t.settings.aboutText} ${Constants.expoConfig?.version ?? '—'}`}
        </Text>
      </Card>
    </Screen>
  );
}

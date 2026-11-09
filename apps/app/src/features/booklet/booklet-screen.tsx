import { calculateBooklet, spineThickness } from '@printcalc/core';
import { StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/number-field';
import { Card, Notice, ResultRow, Row, Screen, SectionTitle, StatTile, SwitchRow } from '@/components/ui';
import { t } from '@/i18n/pl';
import { useCalculatorStore } from '@/store/calculator-store';
import { spacing } from '@/theme/tokens';

export function BookletScreen() {
  const b = useCalculatorStore((s) => s.booklet);
  const setBooklet = useCalculatorStore((s) => s.setBooklet);
  const res = calculateBooklet({ pages: b.pages, pagesPerSheet: b.pagesPerSheet, separateCover: b.separateCover });
  const spine = spineThickness(res.paddedPages, b.grammage, b.bulk);

  return (
    <Screen title={t.booklet.title}>
      <Card>
        <SectionTitle>Parametry</SectionTitle>
        <Row label={t.booklet.pages}>
          <NumberField value={b.pages} onChange={(v) => setBooklet('pages', v)} decimals={0} max={5000} />
        </Row>
        <Row label={t.booklet.pagesPerSheet} hint="4, 8, 16, 32">
          <NumberField value={b.pagesPerSheet} onChange={(v) => setBooklet('pagesPerSheet', Math.max(4, v))} decimals={0} min={4} max={64} />
        </Row>
        <SwitchRow label={t.booklet.separateCover} value={b.separateCover} onChange={(v) => setBooklet('separateCover', v)} />
        <Row label={t.booklet.grammage}>
          <NumberField value={b.grammage} onChange={(v) => setBooklet('grammage', v)} unit={t.common.gsm} decimals={0} max={1000} />
        </Row>
        <Row label={t.booklet.bulk} hint="offset ≈ 1,2–1,3; kreda ≈ 0,8–1,0">
          <NumberField value={b.bulk} onChange={(v) => setBooklet('bulk', v)} decimals={2} max={3} />
        </Row>
      </Card>
      <Card>
        <SectionTitle>{t.result.section}</SectionTitle>
        <View style={styles.tiles}>
          <StatTile label={t.booklet.signatures} value={res.signatures} tone="accent" />
          <StatTile label={t.booklet.spine} value={spine} unit="mm" />
        </View>
        <ResultRow label={t.booklet.paddedPages} value={res.paddedPages} />
        <ResultRow label={t.booklet.blankPages} value={res.blankPages} tone={res.blankPages > 0 ? 'warning' : undefined} />
        {!res.isMultipleOf4 ? <Notice>{t.booklet.notMultipleOf4}</Notice> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md } });

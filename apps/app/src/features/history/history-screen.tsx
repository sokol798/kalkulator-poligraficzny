import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/icons';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { Chip, Empty, Label, ListItem, Screen, SectionLabel, Segmented, TabHeader, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { dayBucket, fmtDec, fmtInt, fmtTime } from '@/lib/format';
import { useAppStore, type HistoryEntry } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Filter = 'all' | 'starred';

export function HistoryScreen() {
  const theme = useTheme();
  const history = useAppStore((s) => s.history);
  const { loadInputs, toggleStar } = useAppStore();
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    const list = history.filter((h) => (filter === 'starred' ? h.starred : h.createdAt >= cutoff || h.starred));
    const g: Record<'today' | 'yesterday' | 'earlier', HistoryEntry[]> = { today: [], yesterday: [], earlier: [] };
    for (const h of list) g[dayBucket(h.createdAt)].push(h);
    return [
      { key: 'today', title: t.history.today, items: g.today },
      { key: 'yesterday', title: t.history.yesterday, items: g.yesterday },
      { key: 'earlier', title: t.history.earlier, items: g.earlier },
    ].filter((x) => x.items.length);
  }, [history, filter]);

  const open = (h: HistoryEntry) => {
    loadInputs(h.inputs);
    useAppStore.setState({ currentEntryId: h.id });
    router.push('/card');
  };
  const repeat = (h: HistoryEntry) => {
    loadInputs(h.inputs);
    router.navigate('/');
  };

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT + spacing.md} footer header={<TabHeader title={t.history.title} right={<Label>{t.history.range}</Label>} />}>
      <Segmented<Filter> surface value={filter} onChange={setFilter} options={[{ value: 'all', label: t.history.all }, { value: 'starred', label: t.history.starred }]} />
      {groups.length === 0 ? <Empty>{filter === 'starred' ? t.history.emptyStarred : t.history.empty}</Empty> : null}
      {groups.map((g) => (
        <View key={g.key} style={{ gap: spacing.sm }}>
          <SectionLabel>{g.title}</SectionLabel>
          {g.items.map((h) => (
            <ListItem key={h.id} style={{ minHeight: 76 }}>
              <Text variant="listNumber" style={{ minWidth: 56 }}>
                {fmtInt(h.summary.sheets)}
              </Text>
              <Pressable onPress={() => open(h)} accessibilityRole="button" style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text variant="bodySemibold" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {h.name || t.history.untitled(h.summary.formatName)}
                  </Text>
                  <Pressable onPress={() => toggleStar(h.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.calc.save} accessibilityState={{ selected: h.starred }}>
                    <StarIcon color={theme.ink} filled={h.starred} />
                  </Pressable>
                </View>
                <Label numberOfLines={1}>
                  {`${h.summary.formatName} · ${fmtInt(h.inputs.quantity)} szt. · ${h.summary.sheetName} · ${h.inputs.grammage} g · ${fmtDec(h.summary.weightKg, 1)} kg · ${fmtTime(h.createdAt)}`}
                </Label>
              </Pressable>
              <Chip small label={t.history.repeat} onPress={() => repeat(h)} />
            </ListItem>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } });

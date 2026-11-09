import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CloseIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { TextField } from '@/components/text-field';
import { Hairline, IconButton, Label, PillButton, Screen, SectionLabel, Text } from '@/components/ui';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import type { LibraryFormat } from '@/lib/library-data';
import { useAllFormats, useAppStore } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';
import { Pressable } from 'react-native';

export function PickFormatScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const formats = useAllFormats();
  const history = useAppStore((s) => s.history);
  const applyFormat = useAppStore((s) => s.applyFormat);
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = (f: LibraryFormat) => !query || f.name.toLowerCase().includes(query) || `${f.width}`.includes(query) || `${f.height}`.includes(query);
    const recentIds = Array.from(new Set(history.map((h) => h.inputs.formatId).filter((x): x is string => !!x))).slice(0, 3);
    const recent = recentIds.map((id) => formats.find((f) => f.id === id)).filter((f): f is LibraryFormat => !!f && match(f));
    const by = (g: LibraryFormat['group'], mine: boolean) => formats.filter((f) => !!f.builtin !== mine && f.group === g && match(f));
    const mine = formats.filter((f) => !f.builtin && match(f));
    return [
      { title: t.pickFormat.recent, items: query ? [] : recent },
      { title: t.pickFormat.mine, items: mine },
      { title: t.pickFormat.seriesA, items: by('A', false) },
      { title: t.pickFormat.seriesB, items: by('B', false) },
      { title: t.pickFormat.other, items: by('other', false) },
    ].filter((g) => g.items.length);
  }, [formats, history, q]);

  const pick = (f: LibraryFormat) => {
    applyFormat(f);
    router.back();
  };

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text variant="headerTitle" style={{ fontSize: 18 }}>
            {t.pickFormat.title}
          </Text>
          <IconButton accessibilityLabel={t.common.close} onPress={() => router.back()} size={36} style={{ backgroundColor: theme.field }}>
            <CloseIcon color={theme.ink} />
          </IconButton>
        </View>
      }>
      <TextField value={q} onChangeText={setQ} placeholder={t.pickFormat.search} autoFocus icon={<SearchIcon color={theme.muted} />} accessibilityLabel={t.pickFormat.search} />
      {groups.map((g) => (
        <View key={g.title}>
          <SectionLabel style={{ marginBottom: spacing.xs }}>{g.title}</SectionLabel>
          {g.items.map((f, i) => (
            <View key={f.id}>
              <Pressable onPress={() => pick(f)} accessibilityRole="button" style={({ pressed }) => [styles.opt, pressed && { opacity: 0.6 }]}>
                <Text variant="item" style={{ minWidth: 72 }}>
                  {f.name}
                </Text>
                <Label>{unit.fmtSize(f.width, f.height)}</Label>
                {f.bleed != null ? <Label style={{ marginLeft: 'auto' }}>{`${t.library.bleed} ${unit.fmt(f.bleed)}`}</Label> : null}
              </Pressable>
              {i < g.items.length - 1 ? <Hairline /> : null}
            </View>
          ))}
        </View>
      ))}
      <PillButton kind="dashed" title={t.pickFormat.custom} icon={<PlusIcon color={theme.ink} />} onPress={() => router.replace('/new-format')} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: spacing.xs },
});

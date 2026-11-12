import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { PlusIcon, SearchIcon, TrashIcon } from '@/components/icons';
import { TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { TextField } from '@/components/text-field';
import { Chip, Empty, FormatThumb, IconButton, Label, ListItem, Screen, SectionLabel, Segmented, TabHeader, Text } from '@/components/ui';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import type { LibraryFormat, LibrarySheet } from '@/lib/library-data';
import { useAllFormats, useAllSheets, useAppStore } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Tab = 'formats' | 'sheets';

export function LibraryScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'sheets' ? 'sheets' : 'formats');
  const isSheets = tab === 'sheets';

  return (
    <Screen
      bottomInset={TAB_BAR_HEIGHT + spacing.md} footer
      header={
        <TabHeader
          title={t.library.title}
          right={
            <IconButton dark accessibilityLabel={isSheets ? t.library.addSheet : t.library.addFormat} onPress={() => router.push(isSheets ? '/new-sheet' : '/new-format')}>
              <PlusIcon color={theme.onInk} />
            </IconButton>
          }
        />
      }>
      <Segmented<Tab> surface value={tab} onChange={setTab} options={[{ value: 'formats', label: t.library.formats }, { value: 'sheets', label: t.library.sheets }]} />
      {isSheets ? <SheetsList /> : <FormatsList />}
    </Screen>
  );
}

function confirmDelete(name: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(`${t.library.delete}: ${name}?`)) onOk();
    return;
  }
  Alert.alert(t.library.delete, name, [{ text: t.newFormat.cancel, style: 'cancel' }, { text: t.library.delete, style: 'destructive', onPress: onOk }]);
}

function FormatsList() {
  const theme = useTheme();
  const unit = useUnit();
  const formats = useAllFormats();
  const settingsBleed = useAppStore((s) => s.settings.bleed);
  const { applyFormat, removeFormat } = useAppStore();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const match = (f: LibraryFormat) => !query || f.name.toLowerCase().includes(query) || `${f.width}`.includes(query) || `${f.height}`.includes(query);
  const mine = formats.filter((f) => !f.builtin && match(f));
  const standard = formats.filter((f) => f.builtin && match(f));

  const use = (f: LibraryFormat) => {
    applyFormat(f);
    router.navigate('/');
  };

  return (
    <>
      <TextField value={q} onChangeText={setQ} placeholder={t.library.search} surface pill icon={<SearchIcon color={theme.muted} />} accessibilityLabel={t.library.search} />
      <SectionLabel>{t.library.mine}</SectionLabel>
      {mine.length === 0 ? <Empty>{t.library.empty}</Empty> : null}
      {mine.map((f) => (
        <ListItem key={f.id} onPress={() => router.push({ pathname: '/new-format', params: { id: f.id } })}>
          <FormatThumb width={f.width} height={f.height} />
          <View style={{ flex: 1 }}>
            <Text variant="bodySemibold">{f.name}</Text>
            <Label>{`${unit.fmtSize(f.width, f.height, false)} · ${t.library.bleed} ${unit.fmt(f.bleed ?? settingsBleed)}`}</Label>
          </View>
          <IconButton accessibilityLabel={`${t.library.delete} ${f.name}`} onPress={() => confirmDelete(f.name, () => removeFormat(f.id))} size={36}>
            <TrashIcon color={theme.muted} />
          </IconButton>
          <Chip small label={t.library.use} onPress={() => use(f)} />
        </ListItem>
      ))}
      <SectionLabel>{t.library.standard}</SectionLabel>
      {standard.map((f) => (
        <ListItem key={f.id} style={{ minHeight: 56, paddingVertical: 10 }}>
          <View style={styles.inline}>
            <Text variant="item" style={{ minWidth: 40 }}>
              {f.name}
            </Text>
            <Label>{unit.fmtSize(f.width, f.height)}</Label>
          </View>
          <Chip small label={t.library.use} onPress={() => use(f)} />
        </ListItem>
      ))}
    </>
  );
}

function SheetsList() {
  const theme = useTheme();
  const unit = useUnit();
  const sheets = useAllSheets();
  const defaultId = useAppStore((s) => s.settings.defaultSheetId);
  const { setSetting, applySheet, removeSheet } = useAppStore();
  const groups = useMemo(
    () => [
      { title: t.pickSheet.offset, items: sheets.filter((s) => s.group === 'offset') },
      { title: t.pickSheet.digital, items: sheets.filter((s) => s.group === 'digital') },
    ],
    [sheets],
  );

  const row = (s: LibrarySheet) => {
    const isDefault = s.id === defaultId;
    return (
      <ListItem key={s.id} onPress={s.builtin ? undefined : () => router.push({ pathname: '/new-sheet', params: { id: s.id } })}>
        <FormatThumb width={s.width} height={s.height} max={46} />
        <View style={{ flex: 1 }}>
          <Text variant="item">{s.name}</Text>
          <Label>{`${unit.fmtSize(s.width, s.height)} · ${s.gripper ? `${t.library.gripper} ${unit.fmt(s.gripper)}` : `${t.library.margin} ${unit.fmt(s.margin)}`}`}</Label>
        </View>
        {!s.builtin ? (
          <IconButton accessibilityLabel={`${t.library.delete} ${s.name}`} onPress={() => confirmDelete(s.name, () => removeSheet(s.id))} size={36}>
            <TrashIcon color={theme.muted} />
          </IconButton>
        ) : null}
        <Chip
          small
          label={isDefault ? t.library.default : t.library.use}
          on={isDefault}
          onPress={() => {
            if (isDefault) {
              applySheet(s.id);
              router.navigate('/');
            } else setSetting('defaultSheetId', s.id);
          }}
          accessibilityLabel={isDefault ? `${s.name}: ${t.library.default}` : `${t.library.default}: ${s.name}`}
        />
      </ListItem>
    );
  };

  return (
    <>
      <Label style={{ marginHorizontal: spacing.xs }}>{t.library.sheetHint}</Label>
      {groups.map((g) => (
        <View key={g.title} style={{ gap: spacing.sm }}>
          <SectionLabel>{g.title}</SectionLabel>
          {g.items.map(row)}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  inline: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 12 },
});

/**
 * Wybór formatu z listy (modal). Grupuje po serii, filtruje po nazwie.
 */
import { formatSize, type SheetFormat } from '@printcalc/core';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { layout, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

interface Props {
  formats: SheetFormat[];
  selectedId: string | null;
  /** Etykieta, gdy nic nie wybrano (wymiar własny). */
  customLabel: string;
  onSelect: (format: SheetFormat) => void;
}

const SERIES_LABEL: Record<SheetFormat['series'], string> = {
  A: 'Seria A',
  B: 'Seria B',
  C: 'Koperty',
  SRA: 'SRA',
  RA: 'RA',
  US: 'Formaty US',
  custom: 'Inne',
};

export function PresetPicker({ formats, selectedId, customLabel, onSelect }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = formats.find((f) => f.id === selectedId);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? formats.filter((f) => f.label.toLowerCase().includes(q) || formatSize(f.size).includes(q)) : formats;
    const rows: ({ kind: 'header'; title: string; key: string } | { kind: 'item'; format: SheetFormat; key: string })[] = [];
    let last: string | null = null;
    for (const f of filtered) {
      if (f.series !== last) {
        rows.push({ kind: 'header', title: SERIES_LABEL[f.series], key: `h-${f.series}` });
        last = f.series;
      }
      rows.push({ kind: 'item', format: f, key: f.id });
    }
    return rows;
  }, [formats, query]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.trigger, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
        <Text variant="label" numberOfLines={1}>
          {selected ? selected.label : customLabel}
        </Text>
        <Text variant="small" color="textFaint">
          ▾
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.bg, paddingTop: insets.top + spacing.md }]}>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t.common.search}
                placeholderTextColor={theme.textFaint}
                autoFocus
                style={[styles.search, typography.body, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              />
              <Button title={t.common.close} onPress={() => setOpen(false)} kind="ghost" />
            </View>
            <FlatList
              data={data}
              keyExtractor={(r) => r.key}
              contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) =>
                item.kind === 'header' ? (
                  <Text variant="section" color="textMuted" style={styles.header}>
                    {item.title}
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => {
                      onSelect(item.format);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={({ pressed }) => [
                      styles.item,
                      { borderBottomColor: theme.border, backgroundColor: item.format.id === selectedId ? theme.accentSoft : pressed ? theme.surfaceAlt : 'transparent' },
                    ]}>
                    <Text variant="body">{item.format.label}</Text>
                    <Text variant="value" color="textMuted">
                      {formatSize(item.format.size)}
                    </Text>
                  </Pressable>
                )
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: layout.controlHeight,
    minWidth: 120,
    maxWidth: 200,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modal: { flex: 1, alignItems: 'center' },
  modalInner: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, paddingHorizontal: spacing.lg },
  modalHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  search: { flex: 1, height: layout.controlHeight + 4, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.xs },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm },
});

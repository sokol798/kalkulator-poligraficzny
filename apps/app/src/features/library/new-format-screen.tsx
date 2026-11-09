import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { TextField } from '@/components/text-field';
import { Card, Chip, FormatThumb, IconButton, Label, PillButton, Screen, StackHeader, Text } from '@/components/ui';
import { quickUps, resolveSheet } from '@/hooks/use-calculation';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { BLEED_OPTIONS, BUILTIN_FORMATS, newId, type LibraryFormat } from '@/lib/library-data';
import { findFormat, useAppStore } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const PRESETS = ['f-a4', 'f-a5', 'f-a6', 'f-dl'];

export function NewFormatScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const myFormats = useAppStore((s) => s.formats);
  const mySheets = useAppStore((s) => s.sheets);
  const settings = useAppStore((s) => s.settings);
  const inputs = useAppStore((s) => s.inputs);
  const { upsertFormat, applyFormat } = useAppStore();
  const editing = id ? findFormat(id, myFormats) : undefined;

  const [width, setWidth] = useState(editing?.width ?? 150);
  const [height, setHeight] = useState(editing?.height ?? 150);
  const [name, setName] = useState(editing?.name ?? '');
  const [bleed, setBleed] = useState<number>(editing?.bleed ?? settings.bleed);
  const customBleed = !BLEED_OPTIONS.includes(bleed);

  const presetId = BUILTIN_FORMATS.find((f) => f.width === width && f.height === height)?.id;

  const preview = useMemo(() => {
    const probe = { ...inputs, width, height, bleed, customSheet: null, sheetId: settings.defaultSheetId };
    const sheet = resolveSheet(probe, mySheets);
    return { sheet, ...quickUps(probe, sheet, settings.rounding) };
  }, [inputs, width, height, bleed, settings, mySheets]);

  const build = (): LibraryFormat => ({
    id: editing?.id ?? newId('f'),
    name: name.trim() || `${unit.fmt(width)} × ${unit.fmt(height)}`,
    width,
    height,
    bleed,
    group: 'other',
  });
  const save = (use: boolean) => {
    const f = build();
    upsertFormat(f);
    if (use) {
      applyFormat(f);
      router.dismissAll();
      router.replace('/');
    } else router.back();
  };

  return (
    <Screen
      header={
        <StackHeader
          title={editing ? t.newFormat.editTitle : t.newFormat.title}
          backLabel={t.newFormat.cancel}
          right={
            <IconButton accessibilityLabel={t.newFormat.cancel} onPress={() => router.back()}>
              <CloseIcon color={theme.ink} />
            </IconButton>
          }
        />
      }>
      <Card>
        <View style={styles.between}>
          <Text variant="bodySemibold">{t.newFormat.net}</Text>
          <Label>{unit.unit}</Label>
        </View>
        <View style={styles.sizeRow}>
          <NumberField value={unit.toDisplay(width)} onChange={(v) => setWidth(unit.fromDisplay(v))} decimals={unit.digits} accessibilityLabel={t.calc.width} />
          <Text variant="value" color="muted">
            ×
          </Text>
          <NumberField value={unit.toDisplay(height)} onChange={(v) => setHeight(unit.fromDisplay(v))} decimals={unit.digits} accessibilityLabel={t.calc.height} />
        </View>
        <View style={styles.chips}>
          {PRESETS.map((pid) => {
            const f = BUILTIN_FORMATS.find((x) => x.id === pid)!;
            return (
              <Chip
                key={pid}
                label={f.name}
                on={presetId === pid}
                onPress={() => {
                  setWidth(f.width);
                  setHeight(f.height);
                }}
              />
            );
          })}
          <Chip label={t.newFormat.custom} on={!presetId} />
        </View>
      </Card>

      <Card>
        <Label>
          {t.newFormat.name} <Text variant="label" color="muted" style={{ fontWeight: '400' }}>{t.newFormat.optional}</Text>
        </Label>
        <TextField value={name} onChangeText={setName} placeholder={t.newFormat.namePlaceholder} accessibilityLabel={t.newFormat.name} />
      </Card>

      <Card>
        <Label>
          {t.newFormat.bleed} <Text variant="label" color="muted" style={{ fontWeight: '400' }}>{t.newFormat.bleedDefault(unit.fmtWithUnit(settings.bleed))}</Text>
        </Label>
        <View style={styles.chips}>
          {BLEED_OPTIONS.map((b) => (
            <Chip key={b} small label={unit.fmt(b)} on={bleed === b} onPress={() => setBleed(b)} />
          ))}
          <NumberField
            value={customBleed ? unit.toDisplay(bleed) : 0}
            onChange={(v) => setBleed(unit.fromDisplay(v))}
            decimals={unit.digits}
            size="sm"
            pill
            placeholder={t.newFormat.otherBleed}
            accessibilityLabel={`${t.newFormat.bleed} ${t.newFormat.otherBleed}`}
            format={(n) => (customBleed && n ? String(n).replace('.', ',') : '')}
            width={80}
          />
        </View>
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <FormatThumb width={width} height={height} max={52} />
        <View style={{ flex: 1 }}>
          <Label>{t.newFormat.preview}</Label>
          <Text variant="body">{t.newFormat.withBleed(unit.fmt(width), unit.fmt(height), unit.fmt(width + 2 * bleed), unit.fmt(height + 2 * bleed))}</Text>
          <Label style={{ fontSize: 12 }}>{t.newFormat.fits(preview.sheet.name, preview.ups)}</Label>
        </View>
      </Card>

      <View style={styles.actions}>
        <PillButton title={t.newFormat.saveUse} onPress={() => save(true)} style={{ flex: 1 }} disabled={!(width > 0 && height > 0)} />
        <PillButton kind="secondary" title={t.newFormat.save} onPress={() => save(false)} disabled={!(width > 0 && height > 0)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});

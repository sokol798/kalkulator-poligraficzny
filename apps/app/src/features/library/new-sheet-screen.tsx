import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/icons';
import { NumberField } from '@/components/number-field';
import { TextField } from '@/components/text-field';
import { Card, Chip, IconButton, Label, PillButton, Row, Screen, Segmented, StackHeader, Text, Toggle } from '@/components/ui';
import { useUnit } from '@/hooks/use-unit';
import { t } from '@/i18n/pl';
import { GRIPPER_OPTIONS, newId, type LibrarySheet, type SheetGroup } from '@/lib/library-data';
import { useAppStore } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function NewSheetScreen() {
  const theme = useTheme();
  const unit = useUnit();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useAppStore((s) => s.sheets.find((x) => x.id === id));
  const defaultSheetId = useAppStore((s) => s.settings.defaultSheetId);
  const { upsertSheet, setSetting, applySheet } = useAppStore();

  const [width, setWidth] = useState(editing?.width ?? 640);
  const [height, setHeight] = useState(editing?.height ?? 900);
  const [name, setName] = useState(editing?.name ?? '');
  const [gripper, setGripper] = useState(editing?.gripper ?? 10);
  const [margin, setMargin] = useState(editing?.margin ?? 5);
  const [group, setGroup] = useState<SheetGroup>(editing?.group ?? 'offset');
  const [makeDefault, setMakeDefault] = useState(editing ? editing.id === defaultSheetId : false);

  const save = (use: boolean) => {
    const s: LibrarySheet = { id: editing?.id ?? newId('sh'), name: name.trim() || `${unit.fmt(width)} × ${unit.fmt(height)}`, width, height, gripper, margin, group };
    upsertSheet(s);
    if (makeDefault) setSetting('defaultSheetId', s.id);
    if (use) {
      applySheet(s.id);
      router.dismissAll();
      router.replace('/');
    } else router.back();
  };

  return (
    <Screen
      header={
        <StackHeader
          title={editing ? t.newSheet.editTitle : t.newSheet.title}
          right={
            <IconButton accessibilityLabel={t.newFormat.cancel} onPress={() => router.back()}>
              <CloseIcon color={theme.ink} />
            </IconButton>
          }
        />
      }>
      <Card>
        <View style={styles.between}>
          <Text variant="bodySemibold">{t.newSheet.size}</Text>
          <Label>{unit.unit}</Label>
        </View>
        <View style={styles.sizeRow}>
          <NumberField value={unit.toDisplay(width)} onChange={(v) => setWidth(unit.fromDisplay(v))} decimals={unit.digits} accessibilityLabel={t.calc.width} />
          <Text variant="value" color="muted">
            ×
          </Text>
          <NumberField value={unit.toDisplay(height)} onChange={(v) => setHeight(unit.fromDisplay(v))} decimals={unit.digits} accessibilityLabel={t.calc.height} />
        </View>
      </Card>
      <Card>
        <Label>
          {t.newSheet.name} <Text variant="label" color="muted" style={{ fontWeight: '400' }}>{t.newFormat.optional}</Text>
        </Label>
        <TextField value={name} onChangeText={setName} placeholder={t.newSheet.namePlaceholder} accessibilityLabel={t.newSheet.name} />
      </Card>
      <Card>
        <Label>{t.newSheet.gripper}</Label>
        <View style={styles.chips}>
          {GRIPPER_OPTIONS.map((g) => (
            <Chip key={g} small label={unit.fmt(g)} on={gripper === g} onPress={() => setGripper(g)} />
          ))}
          <NumberField value={GRIPPER_OPTIONS.includes(gripper) ? 0 : unit.toDisplay(gripper)} onChange={(v) => setGripper(unit.fromDisplay(v))} decimals={unit.digits} size="sm" pill placeholder={t.newFormat.otherBleed} accessibilityLabel={`${t.newSheet.gripper} ${t.newFormat.otherBleed}`} format={(n) => (n ? String(n).replace('.', ',') : '')} width={80} />
        </View>
        <Row title={t.newSheet.margin} hint={unit.unit}>
          <NumberField value={unit.toDisplay(margin)} onChange={(v) => setMargin(unit.fromDisplay(v))} decimals={unit.digits} size="sm" accessibilityLabel={t.newSheet.margin} width={72} />
        </Row>
        <Row title={t.newSheet.group}>
          <Segmented<SheetGroup> value={group} onChange={setGroup} options={[{ value: 'offset', label: t.newSheet.offset }, { value: 'digital', label: t.newSheet.digital }]} style={{ width: 170 }} />
        </Row>
        <Row title={t.newSheet.setDefault} last>
          <Toggle value={makeDefault} onChange={setMakeDefault} accessibilityLabel={t.newSheet.setDefault} />
        </Row>
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

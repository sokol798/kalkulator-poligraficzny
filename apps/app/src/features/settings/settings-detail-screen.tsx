/** Podekran ustawień: lista opcji do wyboru (radio), przełączniki i pola liczbowe. */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/number-field';
import { Card, Hairline, Label, Row, Screen, SectionLabel, StackHeader, Text, Toggle } from '@/components/ui';
import { findItem, type ChoiceField, type SettingsField } from '@/features/settings/settings-items';
import { useAppStore, type Settings } from '@/store/app-store';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function SettingsDetailScreen() {
  const { item } = useLocalSearchParams<{ item: string }>();
  const def = findItem(item);
  const settings = useAppStore((s) => s.settings);
  const setSetting = useAppStore((s) => s.setSetting);

  if (!def) return <Redirect href="/settings" />;

  const set = (key: keyof Settings, value: unknown) => setSetting(key, value as never);

  const visible = (f: SettingsField) => !('showIf' in f && f.showIf) || !!settings[f.showIf];

  return (
    <Screen header={<StackHeader title={def.title} />}>
      {def.hint ? <Label style={{ marginHorizontal: spacing.xs }}>{def.hint}</Label> : null}
      {def.fields.filter(visible).map((f) => {
        if (f.kind === 'toggle') {
          return (
            <Card key={f.key} style={{ paddingVertical: 2, gap: 0 }}>
              <Row title={f.title} hint={f.hint} last>
                <Toggle value={!!settings[f.key]} onChange={(v) => set(f.key, v)} accessibilityLabel={f.title} />
              </Row>
            </Card>
          );
        }
        if (f.kind === 'number') {
          return (
            <Card key={f.key} style={{ paddingVertical: 2, gap: 0 }}>
              <Row title={f.title} hint={f.hint ?? f.unit} last>
                <NumberField value={Number(settings[f.key])} onChange={(v) => set(f.key, v)} decimals={f.decimals} max={f.max} size="md" accessibilityLabel={f.title} width={110} format={(x) => (x > 0 ? String(x).replace('.', ',') : '')} placeholder="0" />
              </Row>
            </Card>
          );
        }
        return <ChoiceCard key={f.key} field={f} value={settings[f.key]} onChange={(v) => set(f.key, v)} />;
      })}
    </Screen>
  );
}

function ChoiceCard({ field, value, onChange }: { field: ChoiceField; value: unknown; onChange: (v: unknown) => void }) {
  const theme = useTheme();
  const isCustom = field.custom && !field.options.some((o) => o.value === value);
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{field.title}</SectionLabel>
      <Card style={{ paddingVertical: 2, gap: 0 }}>
        {field.options.map((o, i) => {
          const on = o.value === value;
          return (
            <View key={String(o.value)}>
              <Pressable onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.opt, pressed && { opacity: 0.6 }]}>
                <Text variant="body" style={{ flex: 1 }}>
                  {o.label}
                  {field.custom?.unit && typeof o.value === 'number' && !o.label.includes(field.custom.unit) ? <Label>{`  ${field.custom.unit}`}</Label> : null}
                </Text>
                <View style={[styles.radio, { borderColor: on ? theme.ink : theme.border }]}>{on ? <View style={[styles.dot, { backgroundColor: theme.ink }]} /> : null}</View>
              </Pressable>
              {i < field.options.length - 1 || field.custom ? <Hairline /> : null}
            </View>
          );
        })}
        {field.custom ? (
          <View style={styles.opt}>
            <Text variant="body" style={{ flex: 1 }} color={isCustom ? 'ink' : 'muted'}>
              Inna wartość
            </Text>
            <NumberField
              value={isCustom ? Number(value) : 0}
              onChange={(v) => onChange(v)}
              decimals={field.custom.decimals}
              max={field.custom.max}
              size="md"
              accessibilityLabel={`${field.title}: inna wartość`}
              width={96}
              placeholder={field.custom.unit}
              format={(x) => (isCustom && x > 0 ? String(x).replace('.', ',') : '')}
            />
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  opt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52, paddingVertical: 8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

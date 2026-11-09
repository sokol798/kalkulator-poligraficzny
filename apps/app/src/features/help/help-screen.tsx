import { View } from 'react-native';

import { Card, Label, Screen, StackHeader, Text } from '@/components/ui';
import { t } from '@/i18n/pl';
import { spacing } from '@/theme/tokens';

export function HelpScreen() {
  return (
    <Screen header={<StackHeader title={t.help.title} />}>
      {t.help.sections.map(([title, body]) => (
        <Card key={title} style={{ gap: spacing.xs }}>
          <Text variant="bodySemibold">{title}</Text>
          <Label>{body}</Label>
        </Card>
      ))}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}

import type { ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function TextField({ icon, pill, surface, style, ...rest }: TextInputProps & { icon?: ReactNode; pill?: boolean; surface?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <TextInput
        placeholderTextColor={theme.muted}
        {...rest}
        style={[
          styles.input,
          typography.body,
          { backgroundColor: surface ? theme.surface : theme.field, color: theme.ink, borderRadius: pill ? radius.pill : radius.md, paddingLeft: icon ? 40 : 14 },
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '100%' },
  icon: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 0, width: '100%' },
});

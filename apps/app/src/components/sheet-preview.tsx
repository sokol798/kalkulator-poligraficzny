/**
 * Podgląd arkusza (SVG): obrys, linia chwytu, użytki (opcjonalnie numerowane).
 * `width`/`height` to rozmiar rysunku w px; proporcje arkusza są zachowane.
 */
import type { ImpositionResult } from '@printcalc/core';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

interface Props {
  result: ImpositionResult;
  maxWidth: number;
  maxHeight: number;
  numbered?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function SheetPreview({ result, maxWidth, maxHeight, numbered, onPress, accessibilityLabel, style }: Props) {
  const theme = useTheme();
  const { sheet, margins } = result.input;
  const layout = result.best;
  if (sheet.width <= 0 || sheet.height <= 0) return null;
  const scale = Math.min(maxWidth / sheet.width, maxHeight / sheet.height);
  const w = sheet.width * scale;
  const h = sheet.height * scale;
  const gap = 1;
  const fontSize = Math.max(8, Math.min(14, (layout?.items[0]?.width ?? 50) * scale * 0.25));

  const svg = (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect x={0} y={0} width={w} height={h} rx={Math.min(8, w * 0.03)} fill={theme.previewSheet} />
      {margins.top > 0 ? (
        <Line x1={0} y1={margins.top * scale} x2={w} y2={margins.top * scale} stroke={theme.previewLine} strokeWidth={1} strokeDasharray="3 2" />
      ) : null}
      {layout?.items.map((it, i) => {
        const x = it.x * scale + gap / 2;
        const y = it.y * scale + gap / 2;
        const iw = Math.max(1, it.width * scale - gap);
        const ih = Math.max(1, it.height * scale - gap);
        return (
          <Rect key={`r${i}`} x={x} y={y} width={iw} height={ih} rx={1} fill={it.orientation === 'portrait' ? theme.previewItem : theme.previewItemAlt} />
        );
      })}
      {numbered
        ? layout?.items.map((it, i) => (
            <SvgText
              key={`t${i}`}
              x={(it.x + it.width / 2) * scale}
              y={(it.y + it.height / 2) * scale + fontSize * 0.35}
              fontSize={fontSize}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              fill={theme.muted}
              textAnchor="middle">
              {String(i + 1)}
            </SvgText>
          ))
        : null}
    </Svg>
  );

  if (!onPress) return <Pressable disabled style={[{ borderRadius: radius.sm, overflow: 'hidden' }, style]}>{svg}</Pressable>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [{ borderRadius: radius.sm, overflow: 'hidden', opacity: pressed ? 0.8 : 1 }, style]}>
      {svg}
    </Pressable>
  );
}

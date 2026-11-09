/**
 * Podgląd arkusza w SVG: obrys arkusza, obszar zadruku, użytki (netto + spad), wymiary.
 * Skaluje się do szerokości kontenera.
 */
import type { ImpositionResult, Layout } from '@printcalc/core';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

interface Props {
  result: ImpositionResult;
  layout: Layout | null;
  maxHeight?: number;
}

export function SheetPreview({ result, layout, maxHeight = 420 }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const { sheet, margins, bleed } = result.input;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (sheet.width <= 0 || sheet.height <= 0) return null;

  const pad = 28; // miejsce na wymiary
  const availW = Math.max(0, width - pad * 2);
  const availH = maxHeight - pad * 2;
  const scale = width > 0 ? Math.min(availW / sheet.width, availH / sheet.height) : 0;
  const w = sheet.width * scale;
  const h = sheet.height * scale;
  const svgH = h + pad * 2;

  const fontSize = 10;
  const stroke = 1;

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      {width > 0 && scale > 0 ? (
        <Svg width={width} height={svgH} viewBox={`0 0 ${width} ${svgH}`}>
          <G x={(width - w) / 2} y={pad}>
            {/* Arkusz */}
            <Rect x={0} y={0} width={w} height={h} fill={theme.previewSheet} stroke={theme.previewSheetBorder} strokeWidth={stroke} />
            {/* Obszar zadruku */}
            <Rect
              x={margins.left * scale}
              y={margins.top * scale}
              width={result.printableArea.width * scale}
              height={result.printableArea.height * scale}
              fill={theme.previewPrintable}
              stroke={theme.border}
              strokeDasharray="4 3"
              strokeWidth={stroke}
            />
            {/* Łapka */}
            {margins.top > 0 ? (
              <Rect x={0} y={0} width={w} height={margins.top * scale} fill={theme.previewBleed} />
            ) : null}
            {/* Użytki */}
            {layout?.items.map((it, i) => {
              const fill = it.orientation === 'portrait' ? theme.previewItem : theme.previewItemAlt;
              const b = bleed * scale;
              return (
                <G key={i}>
                  <Rect x={it.x * scale} y={it.y * scale} width={it.width * scale} height={it.height * scale} fill={theme.previewBleed} stroke={fill} strokeWidth={0.5} />
                  <Rect x={it.x * scale + b} y={it.y * scale + b} width={it.width * scale - 2 * b} height={it.height * scale - 2 * b} fill={fill} fillOpacity={0.85} />
                </G>
              );
            })}
            {/* Wymiary */}
            <Line x1={0} y1={-10} x2={w} y2={-10} stroke={theme.textFaint} strokeWidth={0.75} />
            <SvgText x={w / 2} y={-14} fontSize={fontSize} fontFamily="system-ui, sans-serif" fill={theme.textMuted} textAnchor="middle">
              {`${trim(sheet.width)} mm`}
            </SvgText>
            <Line x1={w + 10} y1={0} x2={w + 10} y2={h} stroke={theme.textFaint} strokeWidth={0.75} />
            <SvgText x={w + 14} y={h / 2} fontSize={fontSize} fontFamily="system-ui, sans-serif" fill={theme.textMuted} textAnchor="middle" transform={`rotate(90 ${w + 14} ${h / 2})`}>
              {`${trim(sheet.height)} mm`}
            </SvgText>
          </G>
        </Svg>
      ) : (
        <View style={{ height: maxHeight }} />
      )}
      <View style={styles.legend}>
        <LegendDot color={theme.previewItem} label="użytek pion" />
        <LegendDot color={theme.previewItemAlt} label="użytek poziom" />
        <LegendDot color={theme.previewBleed} label="spad / łapka" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="small" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

function trim(n: number): string {
  return String(Math.round(n * 10) / 10);
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: spacing.sm },
  legend: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 2 },
});

/**
 * Licznik nakładu jako przewijana taśma z podziałką (jak pokrętło): przeciągasz w bok, wartość
 * zatrzaskuje się na kresce. Skala nieliniowa – drobne kroki przy małych nakładach, większe przy dużych.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';

import { Text } from '@/components/ui';
import { QUANTITY_MAX } from '@/lib/library-data';
import { useTheme } from '@/theme/use-theme';

const TICK = 10; // px między kreskami

/** Wartości kresek: 10…500 000 ze zmiennym krokiem. */
export const QUANTITY_TICKS: number[] = (() => {
  const out: number[] = [];
  const push = (from: number, to: number, step: number) => {
    for (let v = from; v <= to; v += step) if (out[out.length - 1] !== v) out.push(v);
  };
  push(10, 100, 10);
  push(100, 1000, 50);
  push(1000, 5000, 100);
  push(5000, 20000, 500);
  push(20000, 100000, 2000);
  push(100000, QUANTITY_MAX, 10000);
  return out;
})();

export function nearestTickIndex(q: number): number {
  let best = 0;
  let diff = Infinity;
  for (let i = 0; i < QUANTITY_TICKS.length; i++) {
    const d = Math.abs(QUANTITY_TICKS[i]! - q);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return best;
}

/** Następna / poprzednia „ładna” wartość (dla przycisków ±). */
export function stepQuantity(q: number, dir: 1 | -1): number {
  const i = nearestTickIndex(q);
  const cur = QUANTITY_TICKS[i]!;
  if (dir === 1) return cur > q ? cur : (QUANTITY_TICKS[i + 1] ?? QUANTITY_MAX);
  return cur < q ? cur : (QUANTITY_TICKS[i - 1] ?? QUANTITY_TICKS[0]!);
}

interface Props {
  value: number;
  onChange: (q: number) => void;
  accessibilityLabel: string;
}

export function QuantityRuler({ value, onChange, accessibilityLabel }: Props) {
  const theme = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const dragging = useRef(false);
  const lastEmitted = useRef(value);
  const offset = useRef(0);
  const mouseStart = useRef<{ x: number; offset: number } | null>(null);

  const pad = width / 2;
  const index = useMemo(() => nearestTickIndex(value), [value]);

  // Przewiń do wartości ustawionej z zewnątrz (wpisanie, ±, historia).
  useEffect(() => {
    if (!width || dragging.current || lastEmitted.current === value) return;
    ref.current?.scrollTo({ x: index * TICK, animated: true });
  }, [value, index, width]);

  useEffect(() => {
    if (width) ref.current?.scrollTo({ x: index * TICK, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const emitFromOffset = (x: number) => {
    const i = Math.max(0, Math.min(QUANTITY_TICKS.length - 1, Math.round(x / TICK)));
    const q = QUANTITY_TICKS[i]!;
    if (q !== lastEmitted.current) {
      lastEmitted.current = q;
      onChange(q);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.x;
    if (!dragging.current) return;
    const i = Math.max(0, Math.min(QUANTITY_TICKS.length - 1, Math.round(e.nativeEvent.contentOffset.x / TICK)));
    const q = QUANTITY_TICKS[i]!;
    if (q !== lastEmitted.current) {
      lastEmitted.current = q;
      onChange(q);
    }
  };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(QUANTITY_TICKS.length - 1, Math.round(e.nativeEvent.contentOffset.x / TICK)));
    const q = QUANTITY_TICKS[i]!;
    lastEmitted.current = q;
    if (q !== value) onChange(q);
    dragging.current = false;
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  /* Na web ScrollView nie przewija się myszą – obsługujemy przeciąganie ręcznie. */
  const webDrag =
    Platform.OS === 'web'
      ? {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderGrant: (e: GestureResponderEvent) => {
            mouseStart.current = { x: e.nativeEvent.pageX, offset: offset.current };
            dragging.current = true;
          },
          onResponderMove: (e: GestureResponderEvent) => {
            if (!mouseStart.current) return;
            const x = Math.max(0, mouseStart.current.offset - (e.nativeEvent.pageX - mouseStart.current.x));
            offset.current = x;
            ref.current?.scrollTo({ x, animated: false });
            emitFromOffset(x);
          },
          onResponderRelease: () => {
            const x = Math.round(offset.current / TICK) * TICK;
            ref.current?.scrollTo({ x, animated: true });
            emitFromOffset(x);
            mouseStart.current = null;
            dragging.current = false;
          },
          onResponderTerminate: () => {
            mouseStart.current = null;
            dragging.current = false;
          },
        }
      : {};

  return (
    <View onLayout={onLayout} style={[styles.wrap, Platform.OS === 'web' && ({ cursor: 'ew-resize', userSelect: 'none' } as object)]} accessibilityLabel={accessibilityLabel} accessibilityRole="adjustable" accessibilityValue={{ now: value, min: QUANTITY_TICKS[0], max: QUANTITY_MAX }} {...webDrag}>
      {width > 0 ? (
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            dragging.current = true;
          }}
          onScroll={onScroll}
          onMomentumScrollEnd={onEnd}
          onScrollEndDrag={onEnd}
          contentContainerStyle={{ paddingHorizontal: pad }}>
          <View style={styles.ticks}>
            {QUANTITY_TICKS.map((q, i) => {
              const major = isMajor(q);
              return (
                <View key={q} style={[styles.tick, { width: TICK }]}>
                  <View style={[styles.line, { height: major ? 22 : 11, backgroundColor: major ? theme.ink : theme.border }]} />
                  {major ? (
                    <Text variant="small" color="muted" style={styles.label}>
                      {short(q)}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : null}
      <View pointerEvents="none" style={[styles.needle, { left: width / 2 - 1, backgroundColor: theme.ink }]} />
    </View>
  );
}

function isMajor(q: number): boolean {
  if (q < 100) return q % 50 === 0;
  if (q < 1000) return q % 250 === 0 || q === 100;
  if (q < 5000) return q % 1000 === 0;
  if (q < 20000) return q % 5000 === 0;
  if (q < 100000) return q % 20000 === 0;
  return q % 100000 === 0;
}
function short(q: number): string {
  if (q >= 1000) return `${String(q / 1000).replace('.', ',')} tys.`;
  return String(q);
}

const styles = StyleSheet.create({
  wrap: { height: 52, width: '100%', overflow: 'hidden' },
  ticks: { flexDirection: 'row', alignItems: 'flex-start', height: 52 },
  tick: { alignItems: 'center', paddingTop: 4 },
  line: { width: 1.5, borderRadius: 1 },
  label: { position: 'absolute', top: 30, left: (TICK - 48) / 2, width: 48, textAlign: 'center', fontSize: 10 },
  needle: { position: 'absolute', top: 0, width: 2, height: 30, borderRadius: 1 },
});

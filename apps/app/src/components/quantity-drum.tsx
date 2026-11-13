/**
 * Licznik nakładu jako bęben (jak minutnik iOS): trzy kolumny – tysiące, setki, sztuki.
 * Każda kolumna to pionowa lista z zatrzaskiem; wybrany wiersz leży w ciemnym pasku na środku.
 * Działa dotykiem (natywnie) i myszą / kółkiem (web).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, type GestureResponderEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';

import { Text } from '@/components/ui';
import { QUANTITY_MAX } from '@/lib/library-data';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

const ROW = 40;
const VISIBLE = 5; // wierszy widocznych (nieparzyste)
const HEIGHT = ROW * VISIBLE;

export function splitQuantity(q: number): { thousands: number; hundreds: number; units: number } {
  const v = Math.max(0, Math.min(QUANTITY_MAX, Math.round(q)));
  return { thousands: Math.floor(v / 1000), hundreds: Math.floor((v % 1000) / 100), units: v % 100 };
}
export function joinQuantity(p: { thousands: number; hundreds: number; units: number }): number {
  return Math.min(QUANTITY_MAX, p.thousands * 1000 + p.hundreds * 100 + p.units);
}

/** Następna / poprzednia wartość dla przycisków ±: krok 10 do 1000, 50 do 10 000, 100 do 100 000, 1000 wyżej. */
export function stepQuantity(q: number, dir: 1 | -1): number {
  const step = q < 1000 || (dir === -1 && q <= 1000) ? 10 : q < 10000 || (dir === -1 && q <= 10000) ? 50 : q < 100000 || (dir === -1 && q <= 100000) ? 100 : 1000;
  const next = dir === 1 ? Math.floor(q / step) * step + step : Math.ceil(q / step) * step - step;
  return Math.max(0, Math.min(QUANTITY_MAX, next));
}

interface ColumnProps {
  count: number; // liczba wierszy (0..count-1)
  value: number;
  onChange: (v: number) => void;
  render: (i: number, selected: boolean) => string;
  unit: string;
  accessibilityLabel: string;
  flex?: number;
}

function WheelColumn({ count, value, onChange, render, unit, accessibilityLabel, flex = 1 }: ColumnProps) {
  const theme = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const offset = useRef(value * ROW);
  const dragging = useRef(false);
  const lastEmitted = useRef(value);
  const mouseStart = useRef<{ y: number; offset: number } | null>(null);
  const [ready, setReady] = useState(false);

  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  useEffect(() => {
    if (!ready || dragging.current || lastEmitted.current === value) return;
    ref.current?.scrollTo({ y: value * ROW, animated: true });
    lastEmitted.current = value;
  }, [value, ready]);

  const emit = (y: number) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(y / ROW)));
    if (i !== lastEmitted.current) {
      lastEmitted.current = i;
      onChange(i);
    }
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
    if (dragging.current) emit(offset.current);
  };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
    emit(offset.current);
    dragging.current = false;
  };

  const webDrag =
    Platform.OS === 'web'
      ? {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderGrant: (e: GestureResponderEvent) => {
            mouseStart.current = { y: e.nativeEvent.pageY, offset: offset.current };
            dragging.current = true;
          },
          onResponderMove: (e: GestureResponderEvent) => {
            if (!mouseStart.current) return;
            const y = Math.max(0, Math.min((count - 1) * ROW, mouseStart.current.offset - (e.nativeEvent.pageY - mouseStart.current.y)));
            offset.current = y;
            ref.current?.scrollTo({ y, animated: false });
            emit(y);
          },
          onResponderRelease: () => {
            const y = Math.round(offset.current / ROW) * ROW;
            ref.current?.scrollTo({ y, animated: true });
            emit(y);
            mouseStart.current = null;
            dragging.current = false;
          },
          onResponderTerminate: () => {
            mouseStart.current = null;
            dragging.current = false;
          },
          onWheel: (e: { deltaY: number }) => {
            const y = Math.max(0, Math.min((count - 1) * ROW, Math.round(offset.current / ROW) * ROW + (e.deltaY > 0 ? ROW : -ROW)));
            offset.current = y;
            ref.current?.scrollTo({ y, animated: true });
            emit(y);
          },
        }
      : {};

  return (
    <View
      style={[styles.column, { flex }, Platform.OS === 'web' && ({ cursor: 'ns-resize', userSelect: 'none' } as object)]}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ now: value, min: 0, max: count - 1 }}
      {...webDrag}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
        onLayout={() => {
          ref.current?.scrollTo({ y: value * ROW, animated: false });
          setReady(true);
        }}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onScroll={onScroll}
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={onEnd}
        contentContainerStyle={{ paddingVertical: (HEIGHT - ROW) / 2 }}
        style={{ height: HEIGHT }}>
        {items.map((i) => {
          const selected = i === value;
          return (
            <View key={i} style={styles.row}>
              <Text variant={selected ? 'input' : 'value'} color={selected ? 'ink' : 'muted'} style={[styles.num, !selected && { opacity: 0.55 }]}>
                {render(i, selected)}
              </Text>
              {selected ? (
                <Text variant="label" style={styles.unit}>
                  {unit}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      {/* Zanikanie góra / dół */}
      <View pointerEvents="none" style={[styles.fade, { top: 0, backgroundColor: theme.surface, opacity: 0.75 }]} />
      <View pointerEvents="none" style={[styles.fade, { bottom: 0, backgroundColor: theme.surface, opacity: 0.75 }]} />
    </View>
  );
}

interface Props {
  value: number;
  onChange: (q: number) => void;
}

export function QuantityDrum({ value, onChange }: Props) {
  const theme = useTheme();
  const parts = splitQuantity(value);
  const set = (patch: Partial<typeof parts>) => onChange(joinQuantity({ ...parts, ...patch }));
  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={[styles.selection, { backgroundColor: theme.field }]} />
      <WheelColumn count={QUANTITY_MAX / 1000 + 1} value={parts.thousands} onChange={(v) => set({ thousands: v })} render={(i) => String(i)} unit="tys." accessibilityLabel="Tysiące" flex={1.3} />
      <WheelColumn count={10} value={parts.hundreds} onChange={(v) => set({ hundreds: v })} render={(i) => String(i * 100)} unit="" accessibilityLabel="Setki" />
      <WheelColumn count={100} value={parts.units} onChange={(v) => set({ units: v })} render={(i) => String(i)} unit="szt." accessibilityLabel="Sztuki" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', height: HEIGHT, position: 'relative', gap: spacing.xs },
  selection: { position: 'absolute', left: 0, right: 0, top: (HEIGHT - ROW) / 2, height: ROW, borderRadius: radius.md },
  column: { height: HEIGHT, overflow: 'hidden' },
  row: { height: ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  num: { textAlign: 'center' },
  unit: { marginTop: 4 },
  fade: { position: 'absolute', left: 0, right: 0, height: ROW },
});

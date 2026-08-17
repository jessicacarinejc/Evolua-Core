import { Image, StyleSheet, Text, View } from 'react-native';
import type { MuscleImpact } from '../workouts/workout-impact';

declare const require: (path: string) => number;

const anatomySource = require('../../assets/anatomy/muscles-front-back.png');
type Percent = `${number}%`;

type Hotspot = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number;
};

const hotspots: Hotspot[] = [
  { label: 'Ombros', left: 13, top: 16, width: 24, height: 10, radius: 20 },
  { label: 'Ombros', left: 63, top: 16, width: 24, height: 10, radius: 20 },
  { label: 'Peitoral', left: 18, top: 24, width: 15, height: 13, radius: 18 },
  { label: 'Bíceps', left: 8, top: 29, width: 7, height: 15, radius: 14 },
  { label: 'Bíceps', left: 36, top: 29, width: 7, height: 15, radius: 14 },
  { label: 'Tríceps', left: 58, top: 29, width: 7, height: 15, radius: 14 },
  { label: 'Tríceps', left: 87, top: 29, width: 7, height: 15, radius: 14 },
  { label: 'Antebraços', left: 4, top: 41, width: 7, height: 17, radius: 14 },
  { label: 'Antebraços', left: 40, top: 41, width: 7, height: 17, radius: 14 },
  { label: 'Antebraços', left: 54, top: 41, width: 7, height: 17, radius: 14 },
  { label: 'Antebraços', left: 91, top: 41, width: 7, height: 17, radius: 14 },
  { label: 'Core', left: 20, top: 36, width: 12, height: 19, radius: 16 },
  { label: 'Core', left: 69, top: 36, width: 13, height: 19, radius: 16 },
  { label: 'Costas', left: 65, top: 23, width: 20, height: 25, radius: 20 },
  { label: 'Glúteos', left: 66, top: 49, width: 18, height: 13, radius: 20 },
  { label: 'Quadríceps', left: 16, top: 55, width: 9, height: 23, radius: 16 },
  { label: 'Quadríceps', left: 27, top: 55, width: 9, height: 23, radius: 16 },
  { label: 'Posteriores', left: 66, top: 60, width: 8, height: 22, radius: 16 },
  { label: 'Posteriores', left: 77, top: 60, width: 8, height: 22, radius: 16 },
  { label: 'Panturrilhas', left: 17, top: 77, width: 7, height: 18, radius: 14 },
  { label: 'Panturrilhas', left: 28, top: 77, width: 7, height: 18, radius: 14 },
  { label: 'Panturrilhas', left: 67, top: 78, width: 7, height: 17, radius: 14 },
  { label: 'Panturrilhas', left: 78, top: 78, width: 7, height: 17, radius: 14 },
];

function pct(value: number): Percent {
  return `${value}%`;
}

function tone(percent: number) {
  if (percent >= 72) return '#FF5F45';
  if (percent >= 38) return '#FF956F';
  return '#FFC3A8';
}

export function AnatomicalMuscleMap({ impact }: { impact: MuscleImpact[] }) {
  const byLabel = new Map(impact.map((item) => [item.label, item]));

  return (
    <View style={styles.wrap}>
      <View style={styles.figureLabels}>
        <Text style={styles.figureLabel}>FRENTE</Text>
        <Text style={styles.figureLabel}>COSTAS</Text>
      </View>
      <View style={styles.canvas}>
        <Image source={anatomySource} style={styles.image} resizeMode="contain" />
        {hotspots.map((region, index) => {
          const item = byLabel.get(region.label);
          if (!item) return null;
          return (
            <View
              key={`${region.label}-${index}`}
              pointerEvents="none"
              style={[
                styles.hotspot,
                {
                  left: pct(region.left),
                  top: pct(region.top),
                  width: pct(region.width),
                  height: pct(region.height),
                  borderRadius: region.radius ?? 18,
                  backgroundColor: tone(item.percent),
                  opacity: item.percent >= 72 ? 0.52 : item.percent >= 38 ? 0.38 : 0.25,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.credit}>Anatomia: OpenStax · Tomáš Kebert · umimeto.org · CC BY-SA 4.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  figureLabels: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 30, marginBottom: 5 },
  figureLabel: { color: '#6F7E8E', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  canvas: { width: '100%', aspectRatio: 960 / 836, position: 'relative', overflow: 'hidden' },
  image: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  hotspot: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' },
  credit: { color: '#8593A1', fontSize: 7, lineHeight: 10, textAlign: 'center', marginTop: 5 },
});

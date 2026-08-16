import { StyleSheet, Text, View } from 'react-native';
import type { WorkoutExercise, WorkoutSessionExercise } from '../api/client';
import { calculateMuscleImpact } from '../workouts/workout-impact';
import { theme } from '../theme';

type Props = {
  exercises: Array<WorkoutExercise | WorkoutSessionExercise>;
  compact?: boolean;
};

function tone(percent: number) {
  if (percent >= 72) return '#9DCC46';
  if (percent >= 38) return '#5F8FC7';
  return '#B8C7D9';
}

export function WorkoutImpactCard({ exercises, compact = false }: Props) {
  const impact = calculateMuscleImpact(exercises);
  const upper = impact.filter((item) => item.area === 'upper');
  const core = impact.filter((item) => item.area === 'core');
  const lower = impact.filter((item) => item.area === 'lower');

  const regionLevel = (items: typeof impact) => Math.max(0, ...items.map((item) => item.percent));

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>IMPACTO DO TREINO</Text>
          <Text style={styles.title}>Músculos mais trabalhados</Text>
          {!compact ? <Text style={styles.subtitle}>Estimativa baseada nos exercícios, blocos e duração planejados. Não representa dano muscular nem avaliação clínica.</Text> : null}
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>MAPA</Text></View>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.bodyMap}>
          <View style={[styles.head, { backgroundColor: '#DCE5EF' }]} />
          <View style={[styles.shoulders, { backgroundColor: tone(regionLevel(upper)) }]} />
          <View style={[styles.torso, { backgroundColor: tone(regionLevel(core)) }]} />
          <View style={styles.hips} />
          <View style={styles.legsRow}>
            <View style={[styles.leg, { backgroundColor: tone(regionLevel(lower)) }]} />
            <View style={[styles.leg, { backgroundColor: tone(regionLevel(lower)) }]} />
          </View>
          <View style={styles.legendMini}><Text style={styles.legendMiniText}>Visão resumida</Text></View>
        </View>

        <View style={styles.list}>
          {impact.slice(0, compact ? 5 : 7).map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.muscle}>{item.label}</Text>
                <Text style={[styles.level, { color: tone(item.percent) }]}>{item.level}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${item.percent}%`, backgroundColor: tone(item.percent) }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {!compact ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#9DCC46' }]} /><Text style={styles.legendText}>principal</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#5F8FC7' }]} /><Text style={styles.legendText}>moderado</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#B8C7D9' }]} /><Text style={styles.legendText}>apoio</Text></View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F2B4F', borderRadius: 22, padding: 17, marginBottom: 16 },
  cardCompact: { padding: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerText: { flex: 1 },
  eyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.white, fontSize: 18, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#C8D4E3', fontSize: 10, lineHeight: 15, marginTop: 5 },
  badge: { backgroundColor: '#203F66', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: theme.colors.lime, fontSize: 8, fontWeight: '900' },
  bodyRow: { flexDirection: 'row', gap: 15, marginTop: 15, alignItems: 'center' },
  bodyMap: { width: 92, alignItems: 'center', paddingVertical: 8 },
  head: { width: 24, height: 24, borderRadius: 12, marginBottom: 4 },
  shoulders: { width: 70, height: 20, borderRadius: 12 },
  torso: { width: 48, height: 66, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: -2 },
  hips: { width: 43, height: 13, borderRadius: 8, backgroundColor: '#6B7F96', marginTop: 2 },
  legsRow: { flexDirection: 'row', gap: 7, marginTop: 3 },
  leg: { width: 17, height: 62, borderRadius: 10 },
  legendMini: { marginTop: 7 },
  legendMiniText: { color: '#8FA3BA', fontSize: 8, fontWeight: '700' },
  list: { flex: 1, gap: 9 },
  row: { gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  muscle: { color: '#F2F6FA', fontSize: 11, fontWeight: '800', flex: 1 },
  level: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  track: { height: 6, borderRadius: 6, backgroundColor: '#243F61', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 6 },
  legend: { flexDirection: 'row', gap: 13, marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: '#284564' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: '#AFC0D1', fontSize: 8, fontWeight: '700' },
});

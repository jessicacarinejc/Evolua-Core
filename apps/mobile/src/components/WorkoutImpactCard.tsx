import { StyleSheet, Text, View } from 'react-native';
import type { WorkoutExercise, WorkoutSessionExercise } from '../api/client';
import { calculateMuscleImpact } from '../workouts/workout-impact';
import { theme } from '../theme';
import { AnatomicalMuscleMap } from './AnatomicalMuscleMap';

type ExerciseLike = WorkoutExercise | WorkoutSessionExercise;

type Props = {
  exercises: ExerciseLike[];
  compact?: boolean;
};

function tone(percent: number) {
  if (percent >= 72) return '#FF7A59';
  if (percent >= 38) return '#FFB08C';
  return '#F7D0BE';
}

function ExerciseImpactRow({ exercise }: { exercise: ExerciseLike }) {
  const muscles = calculateMuscleImpact([exercise]).filter((muscle) => muscle.label !== 'Corpo inteiro').slice(0, 4);
  return (
    <View style={styles.exerciseImpactRow}>
      <View style={styles.exerciseImpactTop}>
        <Text style={styles.exerciseImpactName}>{exercise.name}</Text>
        <Text style={styles.exerciseImpactPrimary}>{exercise.primaryMuscle}</Text>
      </View>
      <View style={styles.exerciseMuscleChips}>
        {muscles.map((muscle) => (
          <View key={`${exercise.id}-${muscle.key}`} style={[styles.exerciseMuscleChip, { borderColor: tone(muscle.percent) }]}>
            <View style={[styles.exerciseMuscleDot, { backgroundColor: tone(muscle.percent) }]} />
            <Text style={styles.exerciseMuscleChipText}>{muscle.label}</Text>
            <Text style={[styles.exerciseMuscleLevel, { color: tone(muscle.percent) }]}>{muscle.level}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function WorkoutImpactCard({ exercises, compact = false }: Props) {
  const impact = calculateMuscleImpact(exercises);
  const visualImpact = impact.filter((item) => item.label !== 'Corpo inteiro');

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>IMPACTO DO TREINO</Text>
          <Text style={styles.title}>Músculos trabalhados</Text>
          {!compact ? (
            <Text style={styles.subtitle}>Mapa anatômico frontal e posterior com intensidade estimada a partir dos exercícios planejados.</Text>
          ) : null}
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>ANATOMIA</Text></View>
      </View>

      <View style={styles.anatomyPanel}>
        <AnatomicalMuscleMap impact={impact} />
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#FF7A59' }]} /><Text style={styles.legendText}>principal</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#FFB08C' }]} /><Text style={styles.legendText}>moderado</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#F7D0BE' }]} /><Text style={styles.legendText}>apoio</Text></View>
        </View>
      </View>

      <View style={styles.list}>
        {visualImpact.slice(0, compact ? 5 : 7).map((item) => (
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

      {!compact ? (
        <>
          <Text style={styles.disclaimer}>Estimativa funcional de estímulo. Não representa dano muscular nem avaliação clínica.</Text>
          <View style={styles.perExerciseSection}>
            <Text style={styles.perExerciseEyebrow}>POR EXERCÍCIO</Text>
            <Text style={styles.perExerciseTitle}>Onde cada movimento trabalha mais</Text>
            <Text style={styles.perExerciseSubtitle}>Abra a leitura por exercício para entender os grupos principais e de apoio, no mesmo fluxo da prévia do treino.</Text>
            {exercises.map((exercise) => <ExerciseImpactRow key={exercise.id} exercise={exercise} />)}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 17, marginBottom: 16, borderWidth: 1, borderColor: '#E1E6EC' },
  cardCompact: { padding: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerText: { flex: 1 },
  eyebrow: { color: '#F26D4A', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.navy, fontSize: 19, fontWeight: '900', marginTop: 4 },
  subtitle: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  badge: { backgroundColor: '#FFF0EA', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: '#E65E3D', fontSize: 8, fontWeight: '900' },
  anatomyPanel: { backgroundColor: '#F7F9FB', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 10, marginTop: 14, borderWidth: 1, borderColor: '#E7EBEF' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: theme.colors.textMuted, fontSize: 8, fontWeight: '700' },
  list: { gap: 9, marginTop: 14 },
  row: { gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  muscle: { color: theme.colors.navy, fontSize: 11, fontWeight: '800', flex: 1 },
  level: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  track: { height: 6, borderRadius: 6, backgroundColor: '#E9EDF2', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 6 },
  disclaimer: { color: theme.colors.textMuted, fontSize: 8, lineHeight: 13, marginTop: 12 },
  perExerciseSection: { marginTop: 15, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E7EBEF' },
  perExerciseEyebrow: { color: '#F26D4A', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  perExerciseTitle: { color: theme.colors.navy, fontSize: 15, fontWeight: '900', marginTop: 3 },
  perExerciseSubtitle: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 4, marginBottom: 6 },
  exerciseImpactRow: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#EDF0F3' },
  exerciseImpactTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  exerciseImpactName: { color: theme.colors.navy, fontSize: 11, fontWeight: '900', flex: 1 },
  exerciseImpactPrimary: { color: theme.colors.textMuted, fontSize: 8, textTransform: 'capitalize' },
  exerciseMuscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  exerciseMuscleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: '#FFFDFC' },
  exerciseMuscleDot: { width: 5, height: 5, borderRadius: 3 },
  exerciseMuscleChipText: { color: theme.colors.navy, fontSize: 8, fontWeight: '800' },
  exerciseMuscleLevel: { fontSize: 6, fontWeight: '900', textTransform: 'uppercase' },
});
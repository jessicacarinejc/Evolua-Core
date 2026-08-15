import { StyleSheet, Text, View } from 'react-native';
import type { WorkoutExercise, WorkoutSessionExercise } from '../api/client';
import { phaseSummary, WorkoutPhaseKey } from '../workouts/workout-impact';
import { theme } from '../theme';

type Props = {
  exercises: Array<WorkoutExercise | WorkoutSessionExercise>;
  activePhase?: WorkoutPhaseKey;
  compact?: boolean;
};

const phases: Array<{ key: WorkoutPhaseKey; label: string; detail: string; icon: string }> = [
  { key: 'warmup', label: 'Aquecimento', detail: 'Preparar', icon: '◌' },
  { key: 'main', label: 'Treino principal', detail: 'Executar', icon: '▶' },
  { key: 'cooldown', label: 'Resfriamento', detail: 'Desacelerar', icon: '⌄' },
];

export function WorkoutPhaseStrip({ exercises, activePhase, compact = false }: Props) {
  const minutes = phaseSummary(exercises);
  const duration: Record<WorkoutPhaseKey, number> = {
    warmup: minutes.warmupMinutes,
    main: minutes.mainMinutes,
    cooldown: minutes.cooldownMinutes,
  };

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {!compact ? (
        <View style={styles.heading}>
          <View>
            <Text style={styles.eyebrow}>ESTRUTURA DA SESSÃO</Text>
            <Text style={styles.title}>Seu treino em 3 fases</Text>
          </View>
          <Text style={styles.total}>{duration.warmup + duration.main + duration.cooldown} min</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        {phases.map((phase, index) => {
          const active = activePhase === phase.key;
          const completed = activePhase === 'main' && phase.key === 'warmup' || activePhase === 'cooldown' && phase.key !== 'cooldown';
          return (
            <View key={phase.key} style={styles.phaseWrap}>
              <View style={[styles.phase, active && styles.phaseActive, completed && styles.phaseCompleted]}>
                <View style={[styles.icon, active && styles.iconActive, completed && styles.iconCompleted]}>
                  <Text style={[styles.iconText, (active || completed) && styles.iconTextActive]}>{completed ? '✓' : phase.icon}</Text>
                </View>
                <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>{phase.label}</Text>
                <Text style={[styles.minutes, active && styles.minutesActive]}>{duration[phase.key]} min</Text>
              </View>
              {index < phases.length - 1 ? <View style={[styles.connector, completed && styles.connectorDone]} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.white, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 15 },
  compactCard: { padding: 12, marginBottom: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  eyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.navy, fontSize: 17, fontWeight: '900', marginTop: 3 },
  total: { color: theme.colors.navy, backgroundColor: '#EDF3E2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center' },
  phaseWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  phase: { flex: 1, alignItems: 'center', minWidth: 0 },
  phaseActive: {},
  phaseCompleted: {},
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E9EEF4', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  iconActive: { backgroundColor: theme.colors.navy },
  iconCompleted: { backgroundColor: theme.colors.lime },
  iconText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '900' },
  iconTextActive: { color: theme.colors.navyDark },
  label: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  labelActive: { color: theme.colors.navy, fontWeight: '900' },
  minutes: { color: '#94A0B0', fontSize: 8, marginTop: 2 },
  minutesActive: { color: theme.colors.lime, fontWeight: '900' },
  connector: { width: 10, height: 2, backgroundColor: '#DDE5ED', marginHorizontal: -2, marginTop: -24 },
  connectorDone: { backgroundColor: theme.colors.lime },
});

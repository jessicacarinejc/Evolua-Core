import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, WorkoutSession, WorkoutSummary } from '../api/client';
import { theme } from '../theme';

type Props = {
  token: string;
  session: WorkoutSession;
  onSessionChange: (session: WorkoutSession) => void;
  onFinished: (summary: WorkoutSummary) => void;
};

function asNumber(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function durationLabel(seconds: number | null) {
  if (!seconds) return 'por tempo';
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function WorkoutExecutionScreen({ token, session, onSessionChange, onFinished }: Props) {
  const [reps, setReps] = useState('');
  const [loadKg, setLoadKg] = useState('');
  const [rir, setRir] = useState('');
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [workRemaining, setWorkRemaining] = useState(0);
  const [workRunning, setWorkRunning] = useState(false);
  const [perceivedEffort, setPerceivedEffort] = useState('7');
  const [feedback, setFeedback] = useState('');

  const isCircuit = session.plan.safety?.routine === 'calisthenics_circuit';
  const circuitRound = useMemo(() => {
    if (!isCircuit) return null;
    const pendingNumbers = session.exercises
      .flatMap((exercise) => exercise.sets)
      .filter((set) => !set.completed)
      .map((set) => set.setNumber);
    return pendingNumbers.length ? Math.min(...pendingNumbers) : null;
  }, [isCircuit, session]);

  const currentExercise = useMemo(() => {
    if (isCircuit && circuitRound != null) {
      return session.exercises.find((exercise) =>
        exercise.sets.some((set) => set.setNumber === circuitRound && !set.completed),
      ) ?? null;
    }
    return session.exercises.find((exercise) => exercise.sets.some((set) => !set.completed)) ?? null;
  }, [circuitRound, isCircuit, session]);

  const currentSet = useMemo(() => {
    if (!currentExercise) return null;
    if (isCircuit && circuitRound != null) {
      return currentExercise.sets.find((set) => set.setNumber === circuitRound && !set.completed) ?? null;
    }
    return currentExercise.sets.find((set) => !set.completed) ?? null;
  }, [circuitRound, currentExercise, isCircuit]);

  const completedSets = session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length;
  const totalSets = session.exercises.reduce((total, exercise) => total + exercise.plannedSets, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const rounds = Number(session.plan.safety?.rounds ?? currentExercise?.plannedSets ?? 0);

  useEffect(() => {
    if (!restRemaining) return;
    const timer = setInterval(() => setRestRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [restRemaining]);

  useEffect(() => {
    if (!workRunning || workRemaining <= 0) return;
    const timer = setInterval(() => {
      setWorkRemaining((value) => {
        const next = Math.max(0, value - 1);
        if (next === 0) setWorkRunning(false);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [workRemaining, workRunning]);

  useEffect(() => {
    if (!currentExercise || !currentSet) return;
    const previous = [...currentExercise.sets]
      .filter((set) => set.completed && set.setNumber < currentSet.setNumber)
      .sort((a, b) => b.setNumber - a.setNumber)[0];
    setLoadKg(previous?.loadKg != null ? String(previous.loadKg) : '');
    setReps(previous?.repetitions != null ? String(previous.repetitions) : String(currentExercise.repsMin ?? ''));
    setRir(previous?.rir != null ? String(previous.rir) : String(currentExercise.targetRir ?? ''));
    setWorkRemaining(currentExercise.durationSeconds ?? 0);
    setWorkRunning(false);
  }, [currentExercise?.id, currentSet?.setNumber]);

  const saveCurrentSet = async () => {
    if (!currentExercise || !currentSet) return;
    const timed = Boolean(currentExercise.durationSeconds);
    const repetitions = timed ? undefined : asNumber(reps);
    const load = timed ? undefined : asNumber(loadKg);
    const rirValue = asNumber(rir);

    if (timed && workRemaining > 0) {
      Alert.alert('Bloco ainda em andamento', 'Conclua o tempo do exercício antes de registrar este bloco.');
      return;
    }
    if (!timed && (!repetitions || repetitions < 1)) {
      Alert.alert('Informe as repetições', 'Digite quantas repetições foram realizadas nesta série.');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.saveWorkoutSet(token, session.id, {
        exerciseId: currentExercise.id,
        setNumber: currentSet.setNumber,
        repetitions: repetitions == null ? undefined : Math.round(repetitions),
        loadKg: load,
        durationSeconds: timed ? currentExercise.durationSeconds ?? undefined : undefined,
        rir: rirValue,
        completed: true,
      });
      onSessionChange(updated);

      if (isCircuit) {
        const isLastExercise = currentExercise.order === session.exercises.length;
        const isLastRound = currentSet.setNumber >= rounds;
        if (isLastExercise && !isLastRound) {
          setRestRemaining(Number(session.plan.safety?.roundRestSeconds ?? 120));
        } else if (!isLastRound || !isLastExercise) {
          setRestRemaining(Number(session.plan.safety?.transitionSeconds ?? 20));
        }
      } else {
        setRestRemaining(currentExercise.restSeconds ?? 0);
      }
    } catch (cause) {
      Alert.alert('Série não salva', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const finishWorkout = async () => {
    const effort = Number(perceivedEffort);
    if (!Number.isInteger(effort) || effort < 1 || effort > 10) {
      Alert.alert('Esforço inválido', 'Informe um esforço geral entre 1 e 10.');
      return;
    }

    setFinishing(true);
    try {
      const result = await api.completeWorkoutSession(token, session.id, {
        perceivedEffort: effort,
        feedback: feedback.trim() || undefined,
      });
      onSessionChange(result.session);
      onFinished(result.summary);
    } catch (cause) {
      Alert.alert('Treino não finalizado', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setFinishing(false);
    }
  };

  const openVideo = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Vídeo indisponível', 'Não foi possível abrir o vídeo de referência neste dispositivo.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>TREINO EM ANDAMENTO</Text>
          <Text style={styles.title}>{String(session.plan.safety?.split ?? 'Treino personalizado')}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressValue}>{progress}%</Text>
          <Text style={styles.progressLabel}>{completedSets}/{totalSets} blocos</Text>
        </View>
      </View>

      {isCircuit && circuitRound != null ? (
        <View style={styles.roundCard}>
          <Text style={styles.roundEyebrow}>CIRCUITO</Text>
          <Text style={styles.roundValue}>Round {circuitRound} de {rounds}</Text>
          <Text style={styles.roundText}>40s de trabalho · 20s de transição · 2 min entre rounds</Text>
        </View>
      ) : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {restRemaining > 0 ? (
        <View style={styles.restCard}>
          <Text style={styles.restLabel}>{isCircuit && restRemaining > 20 ? 'DESCANSO ENTRE ROUNDS' : 'DESCANSO'}</Text>
          <Text style={styles.restValue}>{restRemaining}s</Text>
          <TouchableOpacity onPress={() => setRestRemaining(0)} style={styles.restButton}>
            <Text style={styles.restButtonText}>Pular descanso</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {currentExercise && currentSet ? (
        <View style={styles.currentCard}>
          <Text style={styles.exerciseOrder}>EXERCÍCIO {currentExercise.order} DE {session.exercises.length}</Text>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.exerciseMuscle}>{currentExercise.primaryMuscle}</Text>

          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>{currentSet.setNumber}/{currentExercise.plannedSets}</Text>
              <Text style={styles.targetLabel}>{isCircuit ? 'round' : 'série'}</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>
                {currentExercise.durationSeconds
                  ? durationLabel(currentExercise.durationSeconds)
                  : `${currentExercise.repsMin ?? '—'}-${currentExercise.repsMax ?? '—'}`}
              </Text>
              <Text style={styles.targetLabel}>alvo</Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>RIR {currentExercise.targetRir}</Text>
              <Text style={styles.targetLabel}>esforço alvo</Text>
            </View>
          </View>

          {currentExercise.instructions ? <Text style={styles.instructions}>{currentExercise.instructions}</Text> : null}

          {currentExercise.videoUrl ? (
            <>
              <TouchableOpacity onPress={() => void openVideo(currentExercise.videoUrl!)} style={styles.videoButton}>
                <Text style={styles.videoButtonText}>Abrir vídeo de referência</Text>
              </TouchableOpacity>
              {currentExercise.videoAttribution ? (
                <Text style={styles.videoCredit}>
                  {currentExercise.videoAttribution}{currentExercise.videoLicense ? ` · ${currentExercise.videoLicense}` : ''}
                </Text>
              ) : null}
            </>
          ) : null}

          {currentExercise.durationSeconds ? (
            <View style={styles.timedCard}>
              <Text style={styles.timedLabel}>{workRemaining > 0 ? 'TEMPO DO BLOCO' : 'BLOCO CONCLUÍDO'}</Text>
              <Text style={styles.timedValue}>{workRemaining}s</Text>
              {workRemaining > 0 ? (
                <TouchableOpacity
                  disabled={restRemaining > 0}
                  onPress={() => setWorkRunning((value) => !value)}
                  style={[styles.timerButton, restRemaining > 0 && styles.disabled]}
                >
                  <Text style={styles.timerButtonText}>{workRunning ? 'Pausar' : workRemaining === currentExercise.durationSeconds ? 'Iniciar' : 'Continuar'}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timedText}>Tempo cumprido. Registre o bloco para avançar.</Text>
              )}
            </View>
          ) : (
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repetições</Text>
                <TextInput value={reps} onChangeText={setReps} keyboardType="number-pad" style={styles.input} placeholder="10" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carga (kg)</Text>
                <TextInput value={loadKg} onChangeText={setLoadKg} keyboardType="decimal-pad" style={styles.input} placeholder="0" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RIR</Text>
                <TextInput value={rir} onChangeText={setRir} keyboardType="decimal-pad" style={styles.input} placeholder="2" />
              </View>
            </View>
          )}

          <TouchableOpacity
            disabled={saving || restRemaining > 0 || (Boolean(currentExercise.durationSeconds) && workRemaining > 0)}
            onPress={saveCurrentSet}
            style={[styles.primaryButton, (saving || restRemaining > 0 || (Boolean(currentExercise.durationSeconds) && workRemaining > 0)) && styles.disabled]}
          >
            {saving ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Concluir bloco</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.finishCard}>
          <Text style={styles.finishTitle}>Todos os blocos concluídos</Text>
          <Text style={styles.finishText}>Registre o esforço geral da sessão para fechar o treino e alimentar seu histórico de evolução.</Text>

          <Text style={styles.inputLabel}>Esforço geral (RPE 1–10)</Text>
          <TextInput value={perceivedEffort} onChangeText={setPerceivedEffort} keyboardType="number-pad" style={styles.fullInput} placeholder="7" />
          <Text style={styles.inputLabel}>Como foi o treino? (opcional)</Text>
          <TextInput value={feedback} onChangeText={setFeedback} style={[styles.fullInput, styles.feedbackInput]} placeholder="Ex.: boa execução, último round mais difícil..." multiline />

          <TouchableOpacity disabled={finishing} onPress={finishWorkout} style={styles.primaryButton}>
            {finishing ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Finalizar treino</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Progresso da sessão</Text>
      {session.exercises.map((exercise) => {
        const done = exercise.sets.filter((set) => set.completed).length;
        return (
          <View key={exercise.id} style={styles.exerciseProgressRow}>
            <View style={styles.exerciseProgressText}>
              <Text style={styles.exerciseProgressName}>{exercise.order}. {exercise.name}</Text>
              <Text style={styles.exerciseProgressMeta}>{done}/{exercise.plannedSets} blocos concluídos</Text>
            </View>
            <Text style={styles.exerciseProgressStatus}>{done === exercise.plannedSets ? '✓' : `${Math.round((done / exercise.plannedSets) * 100)}%`}</Text>
          </View>
        );
      })}

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Segurança durante a execução</Text>
        <Text style={styles.noticeText}>Interrompa a sessão diante de dor aguda, tontura, falta de ar incomum ou qualquer sintoma novo e procure avaliação adequada.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 44, backgroundColor: theme.colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: theme.colors.navy, fontSize: 27, fontWeight: '900', marginTop: 5, textTransform: 'capitalize', maxWidth: 250 },
  progressBadge: { alignItems: 'flex-end' },
  progressValue: { color: theme.colors.navy, fontSize: 24, fontWeight: '900' },
  progressLabel: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
  roundCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 14, marginTop: 14 },
  roundEyebrow: { color: theme.colors.lime, fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  roundValue: { color: theme.colors.navy, fontWeight: '900', fontSize: 18, marginTop: 3 },
  roundText: { color: theme.colors.textMuted, fontSize: 11, marginTop: 3 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: '#E5EBF1', overflow: 'hidden', marginTop: 18, marginBottom: 18 },
  progressBar: { height: 8, backgroundColor: theme.colors.lime, borderRadius: 8 },
  restCard: { backgroundColor: theme.colors.navy, borderRadius: 20, padding: 18, marginBottom: 16, alignItems: 'center' },
  restLabel: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  restValue: { color: theme.colors.white, fontSize: 42, fontWeight: '900', marginVertical: 4 },
  restButton: { paddingVertical: 8, paddingHorizontal: 16 },
  restButtonText: { color: '#C8D4E3', fontWeight: '800', fontSize: 12 },
  currentCard: { backgroundColor: theme.colors.white, borderRadius: 22, padding: 19, borderWidth: 1, borderColor: theme.colors.border },
  exerciseOrder: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  exerciseName: { color: theme.colors.navy, fontSize: 23, fontWeight: '900', marginTop: 6 },
  exerciseMuscle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3, textTransform: 'capitalize' },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 16 },
  targetItem: { flex: 1 },
  targetValue: { color: theme.colors.text, fontWeight: '900', fontSize: 14 },
  targetLabel: { color: theme.colors.textMuted, fontSize: 9, marginTop: 2 },
  instructions: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  videoButton: { alignSelf: 'flex-start', backgroundColor: '#EEF7DE', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  videoButtonText: { color: theme.colors.navy, fontSize: 10, fontWeight: '900' },
  videoCredit: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 14, marginBottom: 10 },
  timedCard: { backgroundColor: '#EDF3E2', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  timedLabel: { color: theme.colors.navy, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  timedValue: { color: theme.colors.navy, fontSize: 42, fontWeight: '900', marginVertical: 5 },
  timedText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  timerButton: { backgroundColor: theme.colors.navy, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28, marginTop: 4 },
  timerButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 14 },
  inputGroup: { flex: 1 },
  inputLabel: { color: theme.colors.text, fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 11, color: theme.colors.text, backgroundColor: '#F9FBFD' },
  fullInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: theme.colors.text, backgroundColor: '#F9FBFD' },
  feedbackInput: { minHeight: 84, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.45 },
  finishCard: { backgroundColor: theme.colors.white, borderRadius: 22, padding: 19, borderWidth: 1, borderColor: theme.colors.border },
  finishTitle: { color: theme.colors.navy, fontSize: 22, fontWeight: '900' },
  finishText: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 8 },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  exerciseProgressRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 8 },
  exerciseProgressText: { flex: 1 },
  exerciseProgressName: { color: theme.colors.navy, fontSize: 12, fontWeight: '900' },
  exerciseProgressMeta: { color: theme.colors.textMuted, fontSize: 10, marginTop: 3 },
  exerciseProgressStatus: { color: theme.colors.lime, fontSize: 15, fontWeight: '900' },
  noticeCard: { backgroundColor: '#FFF4E5', borderRadius: 16, padding: 16, marginTop: 16 },
  noticeTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 13 },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});

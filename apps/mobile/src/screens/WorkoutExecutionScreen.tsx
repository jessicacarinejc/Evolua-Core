import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, WorkoutSession, WorkoutSubstitutionCandidate, WorkoutSummary } from '../api/client';
import { ExerciseVideoPlayer } from '../components/ExerciseVideoPlayer';
import { theme } from '../theme';

type Props = {
  token: string;
  session: WorkoutSession;
  onSessionChange: (session: WorkoutSession) => void;
  onFinished: (summary: WorkoutSummary) => void;
};

type SafetyInputType = 'pain' | 'dizziness' | 'shortness_of_breath' | 'other';

const safetyTypeLabels: Record<SafetyInputType, string> = {
  pain: 'Dor/desconforto',
  dizziness: 'Tontura',
  shortness_of_breath: 'Falta de ar incomum',
  other: 'Outro sintoma',
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
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);
  const [safetyType, setSafetyType] = useState<SafetyInputType>('pain');
  const [bodyArea, setBodyArea] = useState('');
  const [severity, setSeverity] = useState('3');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [reportingSafety, setReportingSafety] = useState(false);
  const [loadingSubstitutions, setLoadingSubstitutions] = useState(false);
  const [substitutingId, setSubstitutingId] = useState<string | null>(null);
  const [substitutions, setSubstitutions] = useState<WorkoutSubstitutionCandidate[]>([]);

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
  const currentExerciseStarted = Boolean(currentExercise?.sets.some((set) => set.completed));

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
    setLoadKg(
      previous?.loadKg != null
        ? String(previous.loadKg)
        : currentSet.loadKg != null
          ? String(currentSet.loadKg)
          : '',
    );
    setReps(previous?.repetitions != null ? String(previous.repetitions) : String(currentExercise.repsMin ?? ''));
    setRir(previous?.rir != null ? String(previous.rir) : String(currentExercise.targetRir ?? ''));
    setWorkRemaining(currentExercise.durationSeconds ?? 0);
    setWorkRunning(false);
    setSubstitutions([]);
    setShowSafetyPanel(false);
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

  const loadSubstitutions = async (exerciseId?: string) => {
    const id = exerciseId ?? currentExercise?.id;
    if (!id) return;
    setLoadingSubstitutions(true);
    try {
      const result = await api.getWorkoutSubstitutions(token, session.id, id);
      setSubstitutions(result.candidates);
      if (!result.candidates.length) {
        Alert.alert('Sem alternativa automática', 'Não encontramos uma substituição compatível com as regras de segurança e os equipamentos atuais. Interrompa o movimento se houver dor e procure orientação adequada quando necessário.');
      }
    } catch (cause) {
      Alert.alert('Alternativas indisponíveis', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setLoadingSubstitutions(false);
    }
  };

  const reportSafetyEvent = async () => {
    if (!currentExercise) return;
    const severityValue = Number(severity);
    if (!Number.isInteger(severityValue) || severityValue < 1 || severityValue > 10) {
      Alert.alert('Intensidade inválida', 'Informe a intensidade do sintoma entre 1 e 10.');
      return;
    }
    if (safetyType === 'pain' && !bodyArea.trim()) {
      Alert.alert('Informe a região', 'Digite onde surgiu a dor ou o desconforto.');
      return;
    }

    setReportingSafety(true);
    try {
      const result = await api.reportWorkoutEvent(token, session.id, {
        type: safetyType,
        exerciseId: currentExercise.id,
        bodyArea: safetyType === 'pain' ? bodyArea.trim() : undefined,
        severity: severityValue,
        notes: safetyNotes.trim() || undefined,
      });
      onSessionChange(result.session);
      Alert.alert(result.stopRecommended ? 'Interrompa o treino' : 'Registro salvo', result.message);
      setSafetyNotes('');
      if (result.substitutionRecommended && !currentExerciseStarted) {
        await loadSubstitutions(currentExercise.id);
      }
    } catch (cause) {
      Alert.alert('Registro não salvo', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setReportingSafety(false);
    }
  };

  const substituteExercise = async (candidate: WorkoutSubstitutionCandidate) => {
    if (!currentExercise) return;
    setSubstitutingId(candidate.id);
    try {
      const updated = await api.substituteWorkoutExercise(token, session.id, {
        currentExerciseId: currentExercise.id,
        replacementExerciseId: candidate.id,
        reason: 'Substituição escolhida durante a sessão por segurança ou conforto.',
      });
      onSessionChange(updated);
      setSubstitutions([]);
      setShowSafetyPanel(false);
      Alert.alert('Exercício substituído', `${candidate.name} entrou no lugar do exercício anterior. A carga não foi transferida automaticamente.`);
    } catch (cause) {
      Alert.alert('Troca não realizada', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setSubstitutingId(null);
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

  const firstSetUsesHistory = Boolean(
    currentExercise &&
    currentSet &&
    !currentExercise.durationSeconds &&
    currentSet.loadKg != null &&
    !currentExercise.sets.some((set) => set.completed),
  );

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
            <ExerciseVideoPlayer
              title={currentExercise.name}
              videoUrl={currentExercise.videoUrl}
              license={currentExercise.videoLicense}
              attribution={currentExercise.videoAttribution}
            />
          ) : null}

          <View style={styles.safetyActions}>
            <TouchableOpacity onPress={() => setShowSafetyPanel((value) => !value)} style={styles.safetyActionButton}>
              <Text style={styles.safetyActionText}>Registrar dor/sintoma</Text>
            </TouchableOpacity>
            {!currentExerciseStarted ? (
              <TouchableOpacity disabled={loadingSubstitutions} onPress={() => void loadSubstitutions()} style={styles.safetyActionButton}>
                <Text style={styles.safetyActionText}>{loadingSubstitutions ? 'Buscando...' : 'Alternativa segura'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showSafetyPanel ? (
            <View style={styles.safetyPanel}>
              <Text style={styles.safetyPanelTitle}>Como você está se sentindo?</Text>
              <View style={styles.safetyTypeWrap}>
                {(Object.keys(safetyTypeLabels) as SafetyInputType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSafetyType(type)}
                    style={[styles.safetyTypeButton, safetyType === type && styles.safetyTypeButtonActive]}
                  >
                    <Text style={[styles.safetyTypeText, safetyType === type && styles.safetyTypeTextActive]}>{safetyTypeLabels[type]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {safetyType === 'pain' ? (
                <>
                  <Text style={styles.inputLabel}>Região do corpo</Text>
                  <TextInput value={bodyArea} onChangeText={setBodyArea} style={styles.fullInput} placeholder="Ex.: joelho direito" />
                </>
              ) : null}
              <Text style={styles.inputLabel}>Intensidade (1–10)</Text>
              <TextInput value={severity} onChangeText={setSeverity} keyboardType="number-pad" style={styles.fullInput} placeholder="3" />
              <Text style={styles.inputLabel}>Observação (opcional)</Text>
              <TextInput value={safetyNotes} onChangeText={setSafetyNotes} style={[styles.fullInput, styles.safetyNotesInput]} placeholder="Ex.: começou ao descer, sensação diferente do esforço muscular..." multiline />
              <TouchableOpacity disabled={reportingSafety} onPress={() => void reportSafetyEvent()} style={styles.safetySaveButton}>
                {reportingSafety ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.safetySaveText}>Salvar ocorrência</Text>}
              </TouchableOpacity>
            </View>
          ) : null}

          {substitutions.length > 0 ? (
            <View style={styles.substitutionCard}>
              <Text style={styles.substitutionTitle}>Alternativas compatíveis</Text>
              <Text style={styles.substitutionIntro}>A troca automática só é liberada antes da primeira série e não transfere a carga sugerida do exercício anterior.</Text>
              {substitutions.map((candidate) => (
                <View key={candidate.id} style={styles.substitutionRow}>
                  <View style={styles.substitutionTextWrap}>
                    <Text style={styles.substitutionName}>{candidate.name}</Text>
                    <Text style={styles.substitutionMeta}>{candidate.primaryMuscle} · {candidate.reason}</Text>
                  </View>
                  <TouchableOpacity
                    disabled={substitutingId != null}
                    onPress={() => void substituteExercise(candidate)}
                    style={styles.substituteButton}
                  >
                    {substitutingId === candidate.id
                      ? <ActivityIndicator color={theme.colors.navyDark} />
                      : <Text style={styles.substituteButtonText}>Trocar</Text>}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
            <>
              {firstSetUsesHistory ? (
                <View style={styles.suggestedLoadCard}>
                  <Text style={styles.suggestedLoadTitle}>Carga sugerida pelo histórico</Text>
                  <Text style={styles.suggestedLoadText}>O valor abaixo foi pré-preenchido a partir dos treinos anteriores. Ajuste ou reduza se a técnica, a recuperação ou qualquer desconforto pedir.</Text>
                </View>
              ) : null}
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
            </>
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

      {session.safetyEvents?.length ? (
        <View style={styles.sessionEventsCard}>
          <Text style={styles.sessionEventsTitle}>Ocorrências desta sessão</Text>
          {session.safetyEvents.slice(0, 4).map((event) => (
            <Text key={event.id} style={styles.sessionEventText}>
              • {event.type === 'pain' ? `Dor${event.bodyArea ? ` em ${event.bodyArea}` : ''}` : event.type === 'substitution' ? 'Substituição de exercício' : 'Sintoma registrado'}{event.severity ? ` · intensidade ${event.severity}/10` : ''}
            </Text>
          ))}
        </View>
      ) : null}

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
  safetyActions: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 12 },
  safetyActionButton: { flex: 1, borderWidth: 1, borderColor: '#E4B36A', backgroundColor: '#FFF7EC', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 9, alignItems: 'center' },
  safetyActionText: { color: theme.colors.warning, fontSize: 10, fontWeight: '900' },
  safetyPanel: { backgroundColor: '#FFF7EC', borderRadius: 14, padding: 13, marginBottom: 14, borderWidth: 1, borderColor: '#F2D3A5' },
  safetyPanelTitle: { color: theme.colors.navy, fontSize: 14, fontWeight: '900' },
  safetyTypeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  safetyTypeButton: { borderRadius: 999, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: theme.colors.white },
  safetyTypeButtonActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  safetyTypeText: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '800' },
  safetyTypeTextActive: { color: theme.colors.white },
  safetyNotesInput: { minHeight: 70, textAlignVertical: 'top' },
  safetySaveButton: { backgroundColor: theme.colors.navy, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  safetySaveText: { color: theme.colors.white, fontWeight: '900', fontSize: 12 },
  substitutionCard: { backgroundColor: '#EEF7DE', borderRadius: 14, padding: 13, marginBottom: 14 },
  substitutionTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 14 },
  substitutionIntro: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 3, marginBottom: 8 },
  substitutionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#D9E7BF' },
  substitutionTextWrap: { flex: 1, paddingRight: 8 },
  substitutionName: { color: theme.colors.navy, fontWeight: '900', fontSize: 12 },
  substitutionMeta: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 2 },
  substituteButton: { backgroundColor: theme.colors.lime, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, minWidth: 58, alignItems: 'center' },
  substituteButtonText: { color: theme.colors.navyDark, fontSize: 10, fontWeight: '900' },
  timedCard: { backgroundColor: '#EDF3E2', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  timedLabel: { color: theme.colors.navy, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  timedValue: { color: theme.colors.navy, fontSize: 42, fontWeight: '900', marginVertical: 5 },
  timedText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  timerButton: { backgroundColor: theme.colors.navy, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 28, marginTop: 4 },
  timerButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 12 },
  suggestedLoadCard: { backgroundColor: '#EEF7DE', borderRadius: 12, padding: 12, marginBottom: 8 },
  suggestedLoadTitle: { color: theme.colors.navy, fontSize: 10, fontWeight: '900' },
  suggestedLoadText: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 3 },
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
  sessionEventsCard: { backgroundColor: theme.colors.white, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginTop: 10 },
  sessionEventsTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13, marginBottom: 5 },
  sessionEventText: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 2 },
  noticeCard: { backgroundColor: '#FFF4E5', borderRadius: 16, padding: 16, marginTop: 16 },
  noticeTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 13 },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});

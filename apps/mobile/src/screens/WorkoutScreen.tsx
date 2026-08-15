import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, TaiChiRoutine, WorkoutPlan, WorkoutSession, WorkoutSummary } from '../api/client';
import { theme } from '../theme';
import { ExerciseGuidancePreview } from '../components/ExerciseGuidancePreview';
import { WeeklyWorkoutCard } from '../components/WeeklyWorkoutCard';
import { WorkoutImpactCard } from '../components/WorkoutImpactCard';
import { WorkoutPhaseStrip } from '../components/WorkoutPhaseStrip';
import { WorkoutExecutionScreen } from './WorkoutExecutionScreen';

type Props = {
  token: string | null;
  onNeedCheckin: () => void;
};

type TaiChiOption = {
  route: TaiChiRoutine;
  routineKey: string;
  eyebrow: string;
  title: string;
  description: string;
};

const taiChiOptions: TaiChiOption[] = [
  {
    route: '15-min',
    routineKey: 'tai_chi_15',
    eyebrow: 'TAI CHI · 15 MIN',
    title: 'Dinâmico e contínuo',
    description: 'Despertar do Qi, Mãos como Nuvens, Repelir o Macaco e Abraçar a Árvore. Foco em continuidade, postura e participação das pernas.',
  },
  {
    route: 'walking',
    routineKey: 'tai_chi_walking',
    eyebrow: 'TAI CHI WALKING · 10–15 MIN',
    title: 'Caminhada consciente e equilíbrio',
    description: 'Transferência de peso, passos à frente com apoio do calcanhar e passos para trás com toque inicial da ponta do pé. A duração se adapta entre 10 e 15 minutos.',
  },
  {
    route: 'chen-20',
    routineKey: 'tai_chi_chen_20',
    eyebrow: 'ESTILO CHEN · 20 MIN',
    title: 'Força isométrica fundamental',
    description: 'Postura do Arco e movimentos de empurrar com tempo sob tensão. A profundidade da base é reduzida quando o check-in indicar dor ou recuperação baixa.',
  },
  {
    route: 'yang-25-30',
    routineKey: 'tai_chi_yang_25_30',
    eyebrow: 'ESTILO YANG · 25–30 MIN',
    title: 'Fluidez, cintura e coordenação',
    description: 'Aparar a Cauda do Pássaro, Mãos como Nuvens e movimentos circulares contínuos. A rotação é adaptada ao conforto da coluna e do quadril.',
  },
];

function durationLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function repsLabel(plan: WorkoutPlan['exercises'][number]) {
  if (plan.durationSeconds) return durationLabel(plan.durationSeconds);
  if (plan.repsMin && plan.repsMax) return `${plan.repsMin}-${plan.repsMax} rep`;
  return 'por tempo';
}

export function WorkoutScreen({ token, onNeedCheckin }: Props) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingTaiChi, setGeneratingTaiChi] = useState<TaiChiRoutine | null>(null);
  const [generatingCalisthenics, setGeneratingCalisthenics] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const active = await api.getActiveWorkoutSession(token);
        if (active) {
          setSession(active);
          return;
        }
        setPlan(await api.getTodayWorkout(token));
      } catch {
        setPlan(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const generate = async () => {
    if (!token) return;
    setGenerating(true);
    setSummary(null);
    try {
      setPlan(await api.generateTodayWorkout(token));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível gerar o treino.';
      Alert.alert('Treino não gerado', message, [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Fazer check-in', onPress: onNeedCheckin },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const generateTaiChi = async (routine: TaiChiRoutine) => {
    if (!token) return;
    setGeneratingTaiChi(routine);
    setSummary(null);
    try {
      setPlan(await api.generateTaiChiWorkout(token, routine));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível preparar o Tai Chi.';
      Alert.alert('Tai Chi não preparado', message, [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Fazer check-in', onPress: onNeedCheckin },
      ]);
    } finally {
      setGeneratingTaiChi(null);
    }
  };

  const generateCalisthenics = async () => {
    if (!token) return;
    setGeneratingCalisthenics(true);
    setSummary(null);
    try {
      setPlan(await api.generateCalisthenicsCircuit(token));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível preparar a calistenia.';
      Alert.alert('Calistenia não preparada', message, [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Fazer check-in', onPress: onNeedCheckin },
      ]);
    } finally {
      setGeneratingCalisthenics(false);
    }
  };

  const start = async () => {
    if (!token || !plan) return;
    setStarting(true);
    try {
      setSession(await api.startWorkoutSession(token, plan.id));
    } catch (cause) {
      Alert.alert('Treino não iniciado', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setStarting(false);
    }
  };

  const handleFinished = (result: WorkoutSummary) => {
    setSummary(result);
    setSession(null);
    setPlan(null);
    Alert.alert(
      'Treino concluído',
      `${result.completedSets} blocos · ${result.durationMinutes} min · volume ${result.totalVolumeKg.toFixed(1)} kg`,
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.lime} />
        <Text style={styles.loadingText}>Carregando treino...</Text>
      </View>
    );
  }

  if (session && token) {
    return (
      <WorkoutExecutionScreen
        token={token}
        session={session}
        onSessionChange={setSession}
        onFinished={handleFinished}
      />
    );
  }

  if (!plan) {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>TREINO</Text>
        <Text style={styles.title}>{summary ? 'Treino concluído' : 'Seu treino de hoje'}</Text>
        <Text style={styles.subtitle}>
          {summary
            ? 'A sessão foi salva no seu histórico e já pode ser usada para acompanhar evolução e progressão.'
            : 'O plano usa objetivo, experiência, equipamentos, dores informadas e o check-in do dia antes de selecionar exercícios.'}
        </Text>

        {token ? <WeeklyWorkoutCard token={token} /> : null}

        {summary ? (
          <View style={styles.summaryCard}>
            <View><Text style={styles.summaryValue}>{summary.completedSets}</Text><Text style={styles.summaryLabel}>blocos</Text></View>
            <View><Text style={styles.summaryValue}>{summary.durationMinutes} min</Text><Text style={styles.summaryLabel}>duração</Text></View>
            <View><Text style={styles.summaryValue}>{summary.totalVolumeKg.toFixed(1)} kg</Text><Text style={styles.summaryLabel}>volume</Text></View>
            <View><Text style={styles.summaryValue}>RPE {summary.perceivedEffort ?? '—'}</Text><Text style={styles.summaryLabel}>esforço</Text></View>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Antes de gerar</Text>
            <Text style={styles.infoText}>Faça o check-in diário. Se houver sintomas novos ou sinal de risco, o treino automático poderá ser bloqueado para revisão profissional.</Text>
          </View>
        )}

        {!summary ? (
          <TouchableOpacity disabled={generating || generatingTaiChi != null || generatingCalisthenics} onPress={generate} style={styles.primaryButton}>
            {generating ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Gerar treino de musculação</Text>}
          </TouchableOpacity>
        ) : null}

        {!summary ? (
          <View style={styles.calisthenicsCard}>
            <Text style={styles.calisthenicsEyebrow}>CALISTENIA · CIRCUITO</Text>
            <Text style={styles.calisthenicsTitle}>40s de trabalho · 20s de transição</Text>
            <Text style={styles.calisthenicsText}>Flexão, Polichinelo, Mergulho no Banco, Joelhos Altos e Flexão Diamante. O app escolhe 3 ou 4 rounds conforme recuperação e tempo disponível, com 2 minutos entre rounds.</Text>
            <Text style={styles.calisthenicsText}>Adaptações iniciantes e versões sem salto são orientadas quando necessário. Dor em ombro, punho ou cotovelo bloqueia este circuito automático.</Text>
            <TouchableOpacity
              disabled={generatingCalisthenics || generating || generatingTaiChi != null}
              onPress={() => void generateCalisthenics()}
              style={styles.calisthenicsButton}
            >
              {generatingCalisthenics
                ? <ActivityIndicator color={theme.colors.white} />
                : <Text style={styles.calisthenicsButtonText}>Preparar circuito de calistenia</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        {!summary ? (
          <>
            <Text style={styles.sectionTitle}>Treinos de Tai Chi</Text>
            <Text style={styles.sectionIntro}>Escolha uma rotina. Todas passam pelo check-in do dia e podem reduzir postura, rotação ou amplitude quando houver limitação informada.</Text>
            {taiChiOptions.map((option) => (
              <View key={option.route} style={styles.taiChiCard}>
                <Text style={styles.taiChiEyebrow}>{option.eyebrow}</Text>
                <Text style={styles.taiChiTitle}>{option.title}</Text>
                <Text style={styles.taiChiText}>{option.description}</Text>
                <TouchableOpacity
                  disabled={generatingTaiChi != null || generating || generatingCalisthenics}
                  onPress={() => void generateTaiChi(option.route)}
                  style={styles.taiChiButton}
                >
                  {generatingTaiChi === option.route
                    ? <ActivityIndicator color={theme.colors.white} />
                    : <Text style={styles.taiChiButtonText}>Preparar esta rotina</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : null}

        <TouchableOpacity onPress={onNeedCheckin} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Atualizar check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const currentRoutine = plan.safety?.routine;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>TREINO DE HOJE</Text>
      <Text style={styles.title}>{String(plan.safety?.split ?? 'Treino personalizado')}</Text>
      <Text style={styles.subtitle}>
        {plan.estimatedMinutes} min · intensidade {String(plan.safety?.allowedIntensity ?? 'adaptada')} · {plan.exercises.length} exercícios
      </Text>

      <View style={styles.guidedHero}>
        <View style={styles.guidedHeroIcon}><Text style={styles.guidedHeroIconText}>▶</Text></View>
        <View style={styles.guidedHeroText}>
          <Text style={styles.guidedHeroEyebrow}>TREINO 100% GUIADO</Text>
          <Text style={styles.guidedHeroTitle}>Veja como fazer antes de começar</Text>
          <Text style={styles.guidedHeroBody}>Todos os exercícios abaixo têm demonstração em 4 fases, respiração, dica para iniciante e erros a evitar. Você pode abrir cada guia antes ou durante o treino.</Text>
        </View>
      </View>

      <WorkoutPhaseStrip exercises={plan.exercises} />
      <WorkoutImpactCard exercises={plan.exercises} />

      {token ? <WeeklyWorkoutCard token={token} /> : null}

      {currentRoutine === 'calisthenics_circuit' ? (
        <View style={styles.circuitInfoCard}>
          <Text style={styles.infoTitle}>Estrutura do circuito</Text>
          <Text style={styles.infoText}>{plan.safety?.rounds ?? 3} rounds · {plan.safety?.workSeconds ?? 40}s por exercício · {plan.safety?.transitionSeconds ?? 20}s entre exercícios · {plan.safety?.roundRestSeconds ?? 120}s entre rounds.</Text>
        </View>
      ) : null}

      {Array.isArray(plan.safety?.notes) && plan.safety.notes.length > 0 ? (
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Ajustes de segurança</Text>
          {plan.safety.notes.map((note) => <Text key={note} style={styles.safetyText}>• {note}</Text>)}
        </View>
      ) : null}

      {plan.exercises.map((exercise) => (
        <View key={exercise.id} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={styles.orderCircle}><Text style={styles.orderText}>{exercise.order}</Text></View>
            <View style={styles.exerciseTitleArea}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMuscle}>{exercise.primaryMuscle}</Text>
            </View>
          </View>

          <View style={styles.prescriptionRow}>
            <View><Text style={styles.prescriptionValue}>{exercise.sets}</Text><Text style={styles.prescriptionLabel}>{currentRoutine === 'calisthenics_circuit' ? 'rounds' : 'séries'}</Text></View>
            <View><Text style={styles.prescriptionValue}>{repsLabel(exercise)}</Text><Text style={styles.prescriptionLabel}>alvo</Text></View>
            <View><Text style={styles.prescriptionValue}>{exercise.restSeconds}s</Text><Text style={styles.prescriptionLabel}>transição</Text></View>
            <View><Text style={styles.prescriptionValue}>RIR {exercise.targetRir}</Text><Text style={styles.prescriptionLabel}>esforço</Text></View>
          </View>

          {exercise.instructions ? <Text style={styles.instructions}>{exercise.instructions}</Text> : null}
          <ExerciseGuidancePreview
            name={exercise.name}
            videoUrl={exercise.videoUrl}
            license={exercise.videoLicense}
            attribution={exercise.videoAttribution}
          />
        </View>
      ))}

      <TouchableOpacity disabled={starting} onPress={start} style={styles.primaryButton}>
        {starting ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Iniciar treino guiado</Text>}
      </TouchableOpacity>

      <TouchableOpacity disabled={generating || starting || generatingTaiChi != null || generatingCalisthenics} onPress={generate} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>{generating ? 'Recalculando...' : 'Trocar por treino de musculação'}</Text>
      </TouchableOpacity>

      {currentRoutine !== 'calisthenics_circuit' ? (
        <TouchableOpacity disabled={generatingCalisthenics || starting} onPress={() => void generateCalisthenics()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{generatingCalisthenics ? 'Preparando calistenia...' : 'Trocar por circuito de calistenia'}</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.switchTitle}>Trocar por outra rotina de Tai Chi</Text>
      {taiChiOptions
        .filter((option) => option.routineKey !== currentRoutine)
        .map((option) => (
          <TouchableOpacity
            key={option.route}
            disabled={generatingTaiChi != null || starting || generatingCalisthenics}
            onPress={() => void generateTaiChi(option.route)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {generatingTaiChi === option.route ? 'Preparando...' : `${option.title} · ${option.eyebrow.replace('TAI CHI · ', '').replace('TAI CHI WALKING · ', '').replace('ESTILO CHEN · ', '').replace('ESTILO YANG · ', '')}`}
            </Text>
          </TouchableOpacity>
        ))}

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Execução segura</Text>
        <Text style={styles.noticeText}>Interrompa o exercício diante de dor aguda, tontura, falta de ar incomum ou sintomas novos e procure avaliação adequada.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, gap: 12 },
  loadingText: { color: theme.colors.textMuted, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 44, backgroundColor: theme.colors.background },
  eyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: theme.colors.navy, fontSize: 30, fontWeight: '900', marginTop: 5, textTransform: 'capitalize' },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  guidedHero: { flexDirection: 'row', backgroundColor: theme.colors.navy, borderRadius: 22, padding: 16, marginBottom: 16, alignItems: 'center' },
  guidedHeroIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  guidedHeroIconText: { color: theme.colors.navyDark, fontSize: 18, fontWeight: '900', marginLeft: 2 },
  guidedHeroText: { flex: 1 },
  guidedHeroEyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  guidedHeroTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900', marginTop: 3 },
  guidedHeroBody: { color: '#C8D4E3', fontSize: 10, lineHeight: 15, marginTop: 4 },
  infoCard: { backgroundColor: '#EDF3E2', borderRadius: 18, padding: 17, marginBottom: 18 },
  circuitInfoCard: { backgroundColor: '#EDF3E2', borderRadius: 18, padding: 17, marginBottom: 14 },
  infoTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 14 },
  infoText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 26, marginBottom: 6 },
  sectionIntro: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  calisthenicsCard: { backgroundColor: '#18345A', borderRadius: 20, padding: 18, marginTop: 14 },
  calisthenicsEyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  calisthenicsTitle: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 6 },
  calisthenicsText: { color: '#C8D4E3', fontSize: 12, lineHeight: 19, marginTop: 8 },
  calisthenicsButton: { backgroundColor: '#2A4E7B', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  calisthenicsButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 13 },
  taiChiCard: { backgroundColor: theme.colors.navy, borderRadius: 20, padding: 18, marginTop: 12 },
  taiChiEyebrow: { color: theme.colors.lime, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  taiChiTitle: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 6 },
  taiChiText: { color: '#C8D4E3', fontSize: 12, lineHeight: 19, marginTop: 8 },
  taiChiButton: { backgroundColor: '#23436D', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  taiChiButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 13 },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 16, marginBottom: 18 },
  summaryValue: { color: theme.colors.navy, fontWeight: '900', fontSize: 14 },
  summaryLabel: { color: theme.colors.textMuted, fontSize: 9, marginTop: 3 },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderColor: theme.colors.navy, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: theme.colors.navy, fontWeight: '900', textAlign: 'center' },
  switchTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '900', marginTop: 24 },
  safetyCard: { backgroundColor: '#FFF4E5', borderRadius: 18, padding: 16, marginBottom: 16 },
  safetyTitle: { color: theme.colors.warning, fontWeight: '900', fontSize: 13 },
  safetyText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  exerciseCard: { backgroundColor: theme.colors.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
  orderCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  orderText: { color: theme.colors.lime, fontWeight: '900' },
  exerciseTitleArea: { flex: 1 },
  exerciseName: { color: theme.colors.navy, fontSize: 17, fontWeight: '900' },
  exerciseMuscle: { color: theme.colors.textMuted, fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  prescriptionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 14 },
  prescriptionValue: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  prescriptionLabel: { color: theme.colors.textMuted, fontSize: 9, marginTop: 2 },
  instructions: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 16 },
  noticeTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13 },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});

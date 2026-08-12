import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, WorkoutPlan, WorkoutSession, WorkoutSummary } from '../api/client';
import { theme } from '../theme';
import { WorkoutExecutionScreen } from './WorkoutExecutionScreen';

type Props = {
  token: string | null;
  onNeedCheckin: () => void;
};

function repsLabel(plan: WorkoutPlan['exercises'][number]) {
  if (plan.durationSeconds) return `${Math.round(plan.durationSeconds / 60)} min`;
  if (plan.repsMin && plan.repsMax) return `${plan.repsMin}-${plan.repsMax} rep`;
  return 'por tempo';
}

export function WorkoutScreen({ token, onNeedCheckin }: Props) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingTaiChi, setGeneratingTaiChi] = useState(false);
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

  const generateTaiChi = async () => {
    if (!token) return;
    setGeneratingTaiChi(true);
    setSummary(null);
    try {
      setPlan(await api.generateTaiChi15Workout(token));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível preparar o Tai Chi.';
      Alert.alert('Tai Chi não preparado', message, [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Fazer check-in', onPress: onNeedCheckin },
      ]);
    } finally {
      setGeneratingTaiChi(false);
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
      `${result.completedSets} séries · ${result.durationMinutes} min · volume ${result.totalVolumeKg.toFixed(1)} kg`,
    );
  };

  const openVideo = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Vídeo indisponível', 'Não foi possível abrir o vídeo de referência neste dispositivo.');
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>TREINO</Text>
        <Text style={styles.title}>{summary ? 'Treino concluído' : 'Seu treino de hoje'}</Text>
        <Text style={styles.subtitle}>
          {summary
            ? 'A sessão foi salva no seu histórico e já pode ser usada para acompanhar evolução e progressão.'
            : 'O plano usa objetivo, experiência, equipamentos, dores informadas e o check-in do dia antes de selecionar exercícios.'}
        </Text>

        {summary ? (
          <View style={styles.summaryCard}>
            <View><Text style={styles.summaryValue}>{summary.completedSets}</Text><Text style={styles.summaryLabel}>séries</Text></View>
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
          <TouchableOpacity disabled={generating} onPress={generate} style={styles.primaryButton}>
            {generating ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Gerar treino de hoje</Text>}
          </TouchableOpacity>
        ) : null}

        {!summary ? (
          <View style={styles.taiChiCard}>
            <Text style={styles.taiChiEyebrow}>TAI CHI · 15 MINUTOS</Text>
            <Text style={styles.taiChiTitle}>Movimento contínuo para elevar o gasto energético</Text>
            <Text style={styles.taiChiText}>Quatro blocos guiados: Despertar do Qi (3 min), Mãos como Nuvens (5 min), Repelir o Macaco (4 min) e Abraçar a Árvore (3 min). A postura é adaptada ao check-in e às dores informadas.</Text>
            <TouchableOpacity disabled={generatingTaiChi} onPress={generateTaiChi} style={styles.taiChiButton}>
              {generatingTaiChi ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.taiChiButtonText}>Preparar Tai Chi de 15 min</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity onPress={onNeedCheckin} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Atualizar check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>TREINO DE HOJE</Text>
      <Text style={styles.title}>{String(plan.safety?.split ?? 'Treino personalizado')}</Text>
      <Text style={styles.subtitle}>
        {plan.estimatedMinutes} min · intensidade {String(plan.safety?.allowedIntensity ?? 'adaptada')} · {plan.exercises.length} exercícios
      </Text>

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
            <View><Text style={styles.prescriptionValue}>{exercise.sets}</Text><Text style={styles.prescriptionLabel}>séries</Text></View>
            <View><Text style={styles.prescriptionValue}>{repsLabel(exercise)}</Text><Text style={styles.prescriptionLabel}>alvo</Text></View>
            <View><Text style={styles.prescriptionValue}>{exercise.restSeconds}s</Text><Text style={styles.prescriptionLabel}>descanso</Text></View>
            <View><Text style={styles.prescriptionValue}>RIR {exercise.targetRir}</Text><Text style={styles.prescriptionLabel}>esforço</Text></View>
          </View>

          {exercise.instructions ? <Text style={styles.instructions}>{exercise.instructions}</Text> : null}
          {exercise.videoUrl ? (
            <>
              <TouchableOpacity onPress={() => void openVideo(exercise.videoUrl!)} style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>Abrir vídeo de referência</Text>
              </TouchableOpacity>
              {exercise.videoAttribution ? (
                <Text style={styles.videoCredit}>{exercise.videoAttribution}{exercise.videoLicense ? ` · ${exercise.videoLicense}` : ''}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.videoPending}>Vídeo demonstrativo será vinculado ao catálogo.</Text>
          )}
        </View>
      ))}

      <TouchableOpacity disabled={starting} onPress={start} style={styles.primaryButton}>
        {starting ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Iniciar treino</Text>}
      </TouchableOpacity>

      <TouchableOpacity disabled={generating || starting} onPress={generate} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>{generating ? 'Recalculando...' : 'Recalcular com check-in atual'}</Text>
      </TouchableOpacity>

      {plan.safety?.routine !== 'tai_chi_15' ? (
        <TouchableOpacity disabled={generatingTaiChi || starting} onPress={generateTaiChi} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{generatingTaiChi ? 'Preparando Tai Chi...' : 'Trocar por Tai Chi · 15 min'}</Text>
        </TouchableOpacity>
      ) : null}

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
  infoCard: { backgroundColor: '#EDF3E2', borderRadius: 18, padding: 17, marginBottom: 18 },
  infoTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 14 },
  infoText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  taiChiCard: { backgroundColor: theme.colors.navy, borderRadius: 20, padding: 18, marginTop: 14 },
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
  secondaryButton: { borderWidth: 1, borderColor: theme.colors.navy, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  secondaryButtonText: { color: theme.colors.navy, fontWeight: '900' },
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
  videoBadge: { alignSelf: 'flex-start', backgroundColor: '#EEF7DE', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, marginTop: 12 },
  videoBadgeText: { color: theme.colors.navy, fontSize: 10, fontWeight: '900' },
  videoCredit: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 6 },
  videoPending: { color: theme.colors.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 12 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 16 },
  noticeTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13 },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});

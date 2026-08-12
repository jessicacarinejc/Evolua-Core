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
import { api, WorkoutPlan } from '../api/client';
import { theme } from '../theme';

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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.lime} />
        <Text style={styles.loadingText}>Carregando treino...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>TREINO</Text>
        <Text style={styles.title}>Seu treino de hoje</Text>
        <Text style={styles.subtitle}>
          O plano usa objetivo, experiência, equipamentos, dores informadas e o check-in do dia antes de selecionar exercícios.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Antes de gerar</Text>
          <Text style={styles.infoText}>Faça o check-in diário. Se houver sintomas novos ou sinal de risco, o treino automático poderá ser bloqueado para revisão profissional.</Text>
        </View>

        <TouchableOpacity disabled={generating} onPress={generate} style={styles.primaryButton}>
          {generating ? <ActivityIndicator color={theme.colors.navyDark} /> : <Text style={styles.primaryButtonText}>Gerar treino de hoje</Text>}
        </TouchableOpacity>
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
            <View style={styles.videoBadge}><Text style={styles.videoBadgeText}>Vídeo disponível</Text></View>
          ) : (
            <Text style={styles.videoPending}>Vídeo demonstrativo será vinculado ao catálogo.</Text>
          )}
        </View>
      ))}

      <TouchableOpacity disabled={generating} onPress={generate} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>{generating ? 'Recalculando...' : 'Recalcular com check-in atual'}</Text>
      </TouchableOpacity>

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
  videoBadge: { alignSelf: 'flex-start', backgroundColor: '#EEF7DE', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, marginTop: 12 },
  videoBadgeText: { color: theme.colors.navy, fontSize: 10, fontWeight: '900' },
  videoPending: { color: theme.colors.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 12 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: 16, padding: 16, marginTop: 16 },
  noticeTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13 },
  noticeText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
});

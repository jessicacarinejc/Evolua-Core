import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { abandonWorkoutSession, WorkoutAbandonReason } from '../workouts/workout-lifecycle';
import { WorkoutMusicPlayer } from './WorkoutMusicPlayer';

type Props = {
  token: string;
  sessionId: string;
  onAbandoned: (reason: WorkoutAbandonReason) => void;
};

export function WorkoutSessionControls({ token, sessionId, onAbandoned }: Props) {
  const [busy, setBusy] = useState<WorkoutAbandonReason | null>(null);

  const execute = async (reason: WorkoutAbandonReason) => {
    setBusy(reason);
    try {
      await abandonWorkoutSession(token, sessionId, reason);
      onAbandoned(reason);
    } catch (cause) {
      Alert.alert('Não foi possível sair do treino', cause instanceof Error ? cause.message : 'Tente novamente.');
    } finally {
      setBusy(null);
    }
  };

  const confirm = (reason: WorkoutAbandonReason) => {
    const switching = reason === 'switch_workout';
    Alert.alert(
      switching ? 'Trocar de treino?' : 'Encerrar treino sem concluir?',
      switching
        ? 'Os blocos já registrados nesta sessão não serão marcados como treino concluído. Você voltará para escolher outro treino.'
        : 'A sessão atual será encerrada sem entrar no histórico como treino concluído. Você poderá iniciar outro treino quando quiser.',
      [
        { text: 'Continuar treino', style: 'cancel' },
        {
          text: switching ? 'Trocar de treino' : 'Encerrar sem concluir',
          style: 'destructive',
          onPress: () => void execute(reason),
        },
      ],
    );
  };

  return (
    <>
      <WorkoutMusicPlayer />
      <View style={styles.card}>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>VOCÊ TEM CONTROLE DA SESSÃO</Text>
          <Text style={styles.title}>Não quer continuar este treino?</Text>
          <Text style={styles.text}>Você pode trocar o plano ou encerrar sem concluir. Nada será registrado como treino concluído por engano.</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            disabled={busy != null}
            onPress={() => confirm('switch_workout')}
            style={styles.switchButton}
          >
            {busy === 'switch_workout'
              ? <ActivityIndicator color={theme.colors.navyDark} />
              : <Text style={styles.switchText}>Trocar de treino</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={busy != null}
            onPress={() => confirm('stop_without_completion')}
            style={styles.stopButton}
          >
            {busy === 'stop_without_completion'
              ? <ActivityIndicator color={theme.colors.white} />
              : <Text style={styles.stopText}>Encerrar sem concluir</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#102B4F', borderRadius: 20, padding: 14, marginTop: 4, marginBottom: 16 },
  textWrap: { gap: 4 },
  eyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.white, fontSize: 16, fontWeight: '900' },
  text: { color: '#C8D4E3', fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  switchButton: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.lime, paddingHorizontal: 8 },
  switchText: { color: theme.colors.navyDark, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  stopButton: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#B8C7D9', paddingHorizontal: 8 },
  stopText: { color: theme.colors.white, fontSize: 11, fontWeight: '900', textAlign: 'center' },
});

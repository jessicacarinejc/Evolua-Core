import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, DailyCheckinInput, DailyCheckinResult } from './src/api/client';
import { sessionStore } from './src/auth/session';
import { OnboardingData } from './src/onboarding/types';
import { AuthScreen } from './src/screens/AuthScreen';
import { DailyCheckinScreen } from './src/screens/DailyCheckinScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { theme } from './src/theme';

type Tab = 'Hoje' | 'Treino' | 'Nutrição' | 'Evolução' | 'Perfil';
type AppStage = 'boot' | 'auth' | 'onboarding' | 'checkin' | 'app';

type Recovery = DailyCheckinResult['evaluation'] | null;

const tabs: Tab[] = ['Hoje', 'Treino', 'Nutrição', 'Evolução', 'Perfil'];

function ProgressBar({ value, total }: { value: number; total: number }) {
  const percent = Math.min(100, Math.max(0, (value / total) * 100));
  return <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${percent}%` }]} /></View>;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function statusText(recovery: Recovery) {
  if (!recovery) return 'check-in pendente';
  if (recovery.status === 'ready') return 'pronto para treinar';
  if (recovery.status === 'modified') return 'treino adaptado';
  if (recovery.status === 'recovery') return 'recuperação';
  return 'revisão recomendada';
}

function TodayScreen({
  profile,
  recovery,
  onCheckin,
  onOpenWorkout,
}: {
  profile: OnboardingData | null;
  recovery: Recovery;
  onCheckin: () => void;
  onOpenWorkout: () => void;
}) {
  const firstName = profile?.displayName.trim().split(' ')[0];
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>EC</Text></View>
        <View>
          <Text style={styles.brandName}>EVOLUA CORE</Text>
          <Text style={styles.brandTagline}>Treino · Nutrição · Saúde · Evolução</Text>
        </View>
      </View>

      <Text style={styles.hello}>{firstName ? `Olá, ${firstName} 👋` : 'Olá 👋'}</Text>
      <Text style={styles.subtitle}>Seu plano diário considera rotina, recuperação, histórico e regras de segurança.</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroEyebrow}>PRÓXIMO TREINO</Text>
            <Text style={styles.heroTitle}>{profile?.primaryGoal === 'hipertrofia' ? 'Força e Hipertrofia' : 'Treino personalizado'}</Text>
          </View>
          <View style={styles.recoveryBadge}>
            <Text style={styles.recoveryValue}>{recovery ? `${recovery.recoveryScore}%` : '—'}</Text>
            <Text style={styles.recoveryLabel}>{statusText(recovery)}</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View><Text style={styles.heroStatValue}>{profile?.sessionMinutes ?? 45} min</Text><Text style={styles.heroStatLabel}>duração alvo</Text></View>
          <View><Text style={styles.heroStatValue}>{profile?.trainingDaysPerWeek ?? 3}x</Text><Text style={styles.heroStatLabel}>por semana</Text></View>
          <View><Text style={styles.heroStatValue}>{profile?.trainingLevel || '—'}</Text><Text style={styles.heroStatLabel}>nível</Text></View>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={recovery ? onOpenWorkout : onCheckin}
        >
          <Text style={styles.primaryButtonText}>{recovery ? 'Abrir treino de hoje' : 'Fazer check-in e preparar treino'}</Text>
        </TouchableOpacity>
      </View>

      {recovery?.notes?.length ? (
        <View style={styles.recoveryCard}>
          <Text style={styles.cardEyebrow}>RECUPERAÇÃO</Text>
          {recovery.notes.map((note) => <Text key={note} style={styles.cardBody}>• {note}</Text>)}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Seu dia</Text>
      <View style={styles.metricGrid}>
        <MetricCard label="Energia" value="—" detail="meta será calculada" />
        <MetricCard label="Proteína" value="—" detail="meta individual" />
        <MetricCard label="Água" value="0 L" detail="registrar consumo" />
        <MetricCard label="Recuperação" value={recovery ? `${recovery.recoveryScore}%` : 'Pendente'} detail={statusText(recovery)} />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View><Text style={styles.cardEyebrow}>NUTRIÇÃO</Text><Text style={styles.cardTitle}>Metas do dia</Text></View>
          <Text style={styles.cardAction}>Configurar</Text>
        </View>
        <Text style={styles.progressText}>Calorias</Text><ProgressBar value={0} total={1} />
        <Text style={styles.progressText}>Proteína</Text><ProgressBar value={0} total={1} />
        <Text style={styles.progressText}>Água</Text><ProgressBar value={0} total={1} />
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Saúde em primeiro lugar</Text>
        <Text style={styles.noticeText}>Sugestões do aplicativo não substituem avaliação médica, nutricional ou de profissional de Educação Física.</Text>
      </View>
    </ScrollView>
  );
}

function PlaceholderScreen({ title }: { title: Tab }) {
  const descriptions: Record<Tab, string> = {
    Hoje: '',
    Treino: '',
    Nutrição: '',
    Evolução: '',
    Perfil: 'Objetivos, saúde, preferências, equipamentos, consentimentos e conta.',
  };
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderText}>{descriptions[title]}</Text>
      <View style={styles.placeholderBadge}><Text style={styles.placeholderBadgeText}>Módulo em construção</Text></View>
    </View>
  );
}

export default function App() {
  const [stage, setStage] = useState<AppStage>('boot');
  const [activeTab, setActiveTab] = useState<Tab>('Hoje');
  const [profile, setProfile] = useState<OnboardingData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<Recovery>(null);

  useEffect(() => {
    void (async () => {
      const storedToken = await sessionStore.get();
      if (!storedToken) {
        setStage('auth');
        return;
      }
      try {
        const user = await api.me(storedToken);
        setToken(storedToken);
        setProfile(user.profile);
        setStage(user.onboardingCompleted ? 'app' : 'onboarding');
      } catch {
        await sessionStore.clear();
        setStage('auth');
      }
    })();
  }, []);

  const handleAuth = async (mode: 'login' | 'register', email: string, password: string) => {
    const response = await api.authenticate(mode, email, password);
    await sessionStore.save(response.token);
    setToken(response.token);
    setProfile(response.user.profile);
    setStage(response.user.onboardingCompleted ? 'app' : 'onboarding');
  };

  const handleOnboarding = async (data: OnboardingData) => {
    if (!token) return;
    try {
      await api.saveOnboarding(token, data);
      setProfile(data);
      setStage('checkin');
    } catch (cause) {
      Alert.alert('Não foi possível salvar', cause instanceof Error ? cause.message : 'Tente novamente.');
    }
  };

  const handleCheckin = async (input: DailyCheckinInput) => {
    if (!token) throw new Error('Sessão não encontrada. Entre novamente.');
    const result = await api.saveDailyCheckin(token, input);
    setRecovery(result.evaluation);
    setActiveTab('Treino');
    setStage('app');
  };

  const screen = useMemo(() => {
    if (activeTab === 'Hoje') {
      return (
        <TodayScreen
          profile={profile}
          recovery={recovery}
          onCheckin={() => setStage('checkin')}
          onOpenWorkout={() => setActiveTab('Treino')}
        />
      );
    }
    if (activeTab === 'Treino') {
      return <WorkoutScreen token={token} onNeedCheckin={() => setStage('checkin')} />;
    }
    if (activeTab === 'Nutrição') {
      return <NutritionScreen profile={profile} token={token} />;
    }
    if (activeTab === 'Evolução') {
      return <ProgressScreen token={token} />;
    }
    return <PlaceholderScreen title={activeTab} />;
  }, [activeTab, profile, recovery, token]);

  if (stage === 'boot') {
    return <View style={styles.boot}><ActivityIndicator size="large" color={theme.colors.lime} /><Text style={styles.bootText}>EVOLUA CORE</Text></View>;
  }
  if (stage === 'auth') return <AuthScreen onSubmit={handleAuth} />;
  if (stage === 'onboarding') return <OnboardingScreen onFinish={handleOnboarding} />;
  if (stage === 'checkin') {
    return <DailyCheckinScreen defaultMinutes={profile?.sessionMinutes ?? 45} defaultPainAreas={profile?.painAreas ?? []} onSubmit={handleCheckin} onCancel={() => setStage('app')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>{screen}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
              <View style={[styles.tabDot, active && styles.tabDotActive]} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center', gap: 16 },
  bootText: { color: theme.colors.white, fontSize: 20, fontWeight: '900', letterSpacing: 1.6 },
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  app: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  brandMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  brandMarkText: { color: theme.colors.lime, fontWeight: '900', fontSize: 18 },
  brandName: { color: theme.colors.navy, fontWeight: '900', fontSize: 17, letterSpacing: 1.2 },
  brandTagline: { color: theme.colors.textMuted, marginTop: 2, fontSize: 11 },
  hello: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6, marginBottom: 20 },
  heroCard: { backgroundColor: theme.colors.navy, borderRadius: theme.radius.lg, padding: theme.spacing.lg },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: theme.colors.white, fontSize: 23, fontWeight: '800', marginTop: 6, maxWidth: 220 },
  recoveryBadge: { alignItems: 'flex-end', maxWidth: 115 },
  recoveryValue: { color: theme.colors.lime, fontSize: 24, fontWeight: '900' },
  recoveryLabel: { color: '#C6D2E3', fontSize: 10, textAlign: 'right' },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
  heroStatValue: { color: theme.colors.white, fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  heroStatLabel: { color: '#B9C8DA', fontSize: 11, marginTop: 3 },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
  recoveryCard: { backgroundColor: '#EEF7DE', borderRadius: theme.radius.md, padding: 16, marginTop: 14 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 28, marginBottom: 14 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  metricLabel: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  metricValue: { color: theme.colors.navy, fontSize: 20, fontWeight: '900', marginTop: 7 },
  metricDetail: { color: theme.colors.textMuted, fontSize: 11, marginTop: 3 },
  sectionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginTop: 14, borderWidth: 1, borderColor: theme.colors.border },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardEyebrow: { color: theme.colors.lime, fontWeight: '900', fontSize: 11, letterSpacing: 1.4 },
  cardTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 19, marginTop: 4 },
  cardAction: { color: theme.colors.navy, fontWeight: '800', fontSize: 13 },
  cardBody: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  progressText: { color: theme.colors.textMuted, fontSize: 12, marginTop: 10, marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: '#EAF0F5', overflow: 'hidden' },
  progressValue: { height: 8, borderRadius: 8, backgroundColor: theme.colors.lime },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: theme.radius.md, padding: 16, marginTop: 14 },
  noticeTitle: { color: theme.colors.navy, fontSize: 14, fontWeight: '900' },
  noticeText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  placeholder: { flex: 1, padding: theme.spacing.lg, paddingTop: 72, backgroundColor: theme.colors.background },
  placeholderTitle: { color: theme.colors.navy, fontSize: 32, fontWeight: '900' },
  placeholderText: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 12, maxWidth: 440 },
  placeholderBadge: { alignSelf: 'flex-start', backgroundColor: '#EDF3E2', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginTop: 24 },
  placeholderBadgeText: { color: theme.colors.navy, fontWeight: '800', fontSize: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, paddingBottom: 8 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: '#CAD2DC', marginBottom: 5 },
  tabDotActive: { width: 18, backgroundColor: theme.colors.lime },
  tabText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: theme.colors.navy, fontWeight: '900' },
});

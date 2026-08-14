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
import { AssistantScreen } from './src/screens/AssistantScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { DailyCheckinScreen } from './src/screens/DailyCheckinScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { theme } from './src/theme';

type Tab = 'Hoje' | 'Treino' | 'Nutrição' | 'Assistente' | 'Evolução' | 'Perfil';
type AppStage = 'boot' | 'auth' | 'onboarding' | 'checkin' | 'app';
type Recovery = DailyCheckinResult['evaluation'] | null;

const tabs: Tab[] = ['Hoje', 'Treino', 'Nutrição', 'Assistente', 'Evolução', 'Perfil'];

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
  onOpenAssistant,
}: {
  profile: OnboardingData | null;
  recovery: Recovery;
  onCheckin: () => void;
  onOpenWorkout: () => void;
  onOpenAssistant: () => void;
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
        <Text style={styles.heroEyebrow}>PRÓXIMO TREINO</Text>
        <Text style={styles.heroTitle}>{profile?.primaryGoal === 'hipertrofia' ? 'Força e Hipertrofia' : 'Treino personalizado'}</Text>
        <View style={styles.heroStats}>
          <View><Text style={styles.heroStatValue}>{profile?.sessionMinutes ?? 45} min</Text><Text style={styles.heroStatLabel}>duração</Text></View>
          <View><Text style={styles.heroStatValue}>{profile?.trainingDaysPerWeek ?? 3}x</Text><Text style={styles.heroStatLabel}>semana</Text></View>
          <View><Text style={styles.heroStatValue}>{recovery ? `${recovery.recoveryScore}%` : '—'}</Text><Text style={styles.heroStatLabel}>{statusText(recovery)}</Text></View>
        </View>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={recovery ? onOpenWorkout : onCheckin}>
          <Text style={styles.primaryButtonText}>{recovery ? 'Abrir treino de hoje' : 'Fazer check-in e preparar treino'}</Text>
        </TouchableOpacity>
      </View>

      {recovery?.notes?.length ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardEyebrow}>RECUPERAÇÃO</Text>
          {recovery.notes.map((note) => <Text key={note} style={styles.cardBody}>• {note}</Text>)}
        </View>
      ) : null}

      <TouchableOpacity style={styles.assistantCard} activeOpacity={0.85} onPress={onOpenAssistant}>
        <View style={styles.assistantBadge}><Text style={styles.assistantBadgeText}>AI</Text></View>
        <View style={styles.assistantCopy}>
          <Text style={styles.cardEyebrow}>EVOLUA ASSIST</Text>
          <Text style={styles.cardTitle}>Pergunte com segurança</Text>
          <Text style={styles.cardBody}>O assistente aplica bloqueios determinísticos antes de responder e nunca altera medicação ou insulina.</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Saúde em primeiro lugar</Text>
        <Text style={styles.noticeText}>Sugestões do aplicativo não substituem avaliação médica, nutricional ou de profissional de Educação Física.</Text>
      </View>
    </ScrollView>
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
          onOpenAssistant={() => setActiveTab('Assistente')}
        />
      );
    }
    if (activeTab === 'Treino') return <WorkoutScreen token={token} onNeedCheckin={() => setStage('checkin')} />;
    if (activeTab === 'Nutrição') return <NutritionScreen profile={profile} token={token} />;
    if (activeTab === 'Assistente') return <AssistantScreen token={token} />;
    if (activeTab === 'Evolução') return <ProgressScreen token={token} />;
    return <ProfileScreen token={token} profile={profile} onProfileUpdated={setProfile} />;
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
              <Text numberOfLines={1} style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
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
  heroEyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: theme.colors.white, fontSize: 23, fontWeight: '800', marginTop: 6 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
  heroStatValue: { color: theme.colors.white, fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  heroStatLabel: { color: '#B9C8DA', fontSize: 10, marginTop: 3, maxWidth: 100 },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
  infoCard: { backgroundColor: '#EEF7DE', borderRadius: theme.radius.md, padding: 16, marginTop: 14 },
  assistantCard: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, marginTop: 14, borderWidth: 1, borderColor: theme.colors.border },
  assistantBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navy },
  assistantBadgeText: { color: theme.colors.lime, fontWeight: '900', fontSize: 16 },
  assistantCopy: { flex: 1 },
  cardEyebrow: { color: theme.colors.lime, fontWeight: '900', fontSize: 11, letterSpacing: 1.4 },
  cardTitle: { color: theme.colors.text, fontWeight: '800', fontSize: 18, marginTop: 3 },
  cardBody: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  noticeCard: { backgroundColor: '#EDF3E2', borderRadius: theme.radius.md, padding: 16, marginTop: 14 },
  noticeTitle: { color: theme.colors.navy, fontSize: 14, fontWeight: '900' },
  noticeText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  tabBar: { flexDirection: 'row', backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, paddingBottom: 8 },
  tabItem: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 2 },
  tabDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: '#CAD2DC', marginBottom: 4 },
  tabDotActive: { width: 16, backgroundColor: theme.colors.lime },
  tabText: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '700' },
  tabTextActive: { color: theme.colors.navy, fontWeight: '900' },
});

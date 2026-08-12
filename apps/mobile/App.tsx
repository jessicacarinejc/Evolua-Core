import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OnboardingData } from './src/onboarding/types';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { theme } from './src/theme';

type Tab = 'Hoje' | 'Treino' | 'Nutrição' | 'Evolução' | 'Perfil';
type AppStage = 'auth' | 'onboarding' | 'app';

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

function TodayScreen({ profile }: { profile: OnboardingData | null }) {
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
      <Text style={styles.subtitle}>Seu plano diário será ajustado conforme rotina, recuperação, histórico e regras de segurança.</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroEyebrow}>PRÓXIMO TREINO</Text>
            <Text style={styles.heroTitle}>{profile?.primaryGoal === 'hipertrofia' ? 'Força e Hipertrofia' : 'Treino personalizado'}</Text>
          </View>
          <View style={styles.recoveryBadge}>
            <Text style={styles.recoveryValue}>—</Text>
            <Text style={styles.recoveryLabel}>check-in pendente</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View><Text style={styles.heroStatValue}>{profile?.sessionMinutes ?? 45} min</Text><Text style={styles.heroStatLabel}>duração alvo</Text></View>
          <View><Text style={styles.heroStatValue}>{profile?.trainingDaysPerWeek ?? 3}x</Text><Text style={styles.heroStatLabel}>por semana</Text></View>
          <View><Text style={styles.heroStatValue}>{profile?.trainingLevel || '—'}</Text><Text style={styles.heroStatLabel}>nível</Text></View>
        </View>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Fazer check-in e gerar treino</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Seu dia</Text>
      <View style={styles.metricGrid}>
        <MetricCard label="Energia" value="—" detail="meta será calculada" />
        <MetricCard label="Proteína" value="—" detail="meta individual" />
        <MetricCard label="Água" value="0 L" detail="registrar consumo" />
        <MetricCard label="Treino" value="Pendente" detail="check-in necessário" />
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

      <View style={styles.sectionCard}>
        <Text style={styles.cardEyebrow}>CHECK-IN</Text>
        <Text style={styles.cardTitle}>Como você está hoje?</Text>
        <Text style={styles.cardBody}>Sono, energia, dor muscular, dor articular e tempo disponível serão considerados antes de gerar o treino.</Text>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}><Text style={styles.secondaryButtonText}>Fazer check-in diário</Text></TouchableOpacity>
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
    Treino: 'Treinos adaptativos, histórico de cargas, vídeos, execução guiada e recuperação.',
    Nutrição: 'Plano alimentar, diário, macros, restrições, hidratação e substituições.',
    Evolução: 'Peso, medidas, fotos, aderência, cargas e indicadores de progresso.',
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
  const [stage, setStage] = useState<AppStage>('auth');
  const [activeTab, setActiveTab] = useState<Tab>('Hoje');
  const [profile, setProfile] = useState<OnboardingData | null>(null);

  const screen = useMemo(
    () => activeTab === 'Hoje' ? <TodayScreen profile={profile} /> : <PlaceholderScreen title={activeTab} />,
    [activeTab, profile],
  );

  if (stage === 'auth') return <AuthScreen onContinue={() => setStage('onboarding')} />;
  if (stage === 'onboarding') {
    return <OnboardingScreen onFinish={(data) => { setProfile(data); setStage('app'); }} />;
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
  recoveryBadge: { alignItems: 'flex-end' },
  recoveryValue: { color: theme.colors.lime, fontSize: 24, fontWeight: '900' },
  recoveryLabel: { color: '#C6D2E3', fontSize: 10 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 },
  heroStatValue: { color: theme.colors.white, fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  heroStatLabel: { color: '#B9C8DA', fontSize: 11, marginTop: 3 },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
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
  secondaryButton: { marginTop: 18, borderWidth: 1, borderColor: theme.colors.navy, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: theme.colors.navy, fontWeight: '800' },
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

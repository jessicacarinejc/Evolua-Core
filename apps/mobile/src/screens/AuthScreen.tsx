import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiBaseUrl, isOfflineHomologation, isPlaceholderApiUrl, probeApiBaseUrl, setApiBaseUrl } from '../api/runtime-config';
import { theme } from '../theme';

type Props = {
  onSubmit: (mode: 'login' | 'register', email: string, password: string) => Promise<void>;
};

type EnvironmentStatus = 'checking' | 'ready' | 'missing' | 'error';

export function AuthScreen({ onSubmit }: Props) {
  const offlineMode = isOfflineHomologation();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>(offlineMode ? 'ready' : 'checking');

  const verifyEnvironment = async (url: string) => {
    if (offlineMode) {
      setEnvironmentStatus('ready');
      setConfigMessage('Homologação offline ativa no próprio aparelho.');
      return true;
    }
    if (isPlaceholderApiUrl(url)) {
      setEnvironmentStatus('missing');
      setConfigMessage('A API de homologação ainda não está configurada para este aparelho.');
      return false;
    }
    setEnvironmentStatus('checking');
    const result = await probeApiBaseUrl(url);
    setEnvironmentStatus(result.ok ? 'ready' : 'error');
    setConfigMessage(result.message);
    return result.ok;
  };

  useEffect(() => {
    if (offlineMode) {
      setEnvironmentStatus('ready');
      setConfigMessage('Homologação offline ativa no próprio aparelho.');
      return;
    }
    void (async () => {
      try {
        const url = await getApiBaseUrl();
        setApiUrl(url);
        await verifyEnvironment(url);
      } catch {
        setEnvironmentStatus('missing');
        setConfigMessage('Configure a API de homologação antes de criar ou acessar uma conta.');
      }
    })();
  }, [offlineMode]);

  const credentialsValid = email.trim().includes('@') && password.length >= 8;
  const canContinue = credentialsValid && (offlineMode || environmentStatus === 'ready') && !loading;

  const submit = async () => {
    if (!offlineMode && environmentStatus !== 'ready') {
      setConfigOpen(true);
      setError('O servidor de homologação precisa estar conectado antes de continuar.');
      return;
    }
    if (!canContinue) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(mode, email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const saveApiUrl = async () => {
    setConfigSaving(true);
    setConfigMessage('');
    try {
      const saved = await setApiBaseUrl(apiUrl);
      setApiUrl(saved);
      await verifyEnvironment(saved);
    } catch (cause) {
      setEnvironmentStatus('error');
      setConfigMessage(cause instanceof Error ? cause.message : 'Não foi possível salvar o ambiente.');
    } finally {
      setConfigSaving(false);
    }
  };

  const environmentLabel = offlineMode
    ? 'Homologação offline no aparelho'
    : environmentStatus === 'ready'
      ? 'Ambiente conectado'
      : environmentStatus === 'checking'
        ? 'Verificando ambiente...'
        : 'Ambiente não conectado';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.brandArea}>
        <View style={styles.logoFrame} accessibilityLabel="Evolua Core">
          <Image source={require('../../assets/brand/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>EVOLUA CORE</Text>
        <Text style={styles.tagline}>Treino · Nutrição · Saúde · Evolução</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}</Text>
        <Text style={styles.subtitle}>
          {offlineMode
            ? 'Nesta homologação, sua conta, perfil e registros ficam no próprio aparelho.'
            : 'Seu perfil, restrições e evolução ficam vinculados à sua conta.'}
        </Text>

        <View style={[styles.environmentStatus, environmentStatus === 'ready' ? styles.environmentStatusReady : styles.environmentStatusPending]}>
          <Text style={styles.environmentStatusText}>{environmentLabel}</Text>
        </View>

        <Text style={styles.label}>E-mail</Text>
        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="voce@exemplo.com" placeholderTextColor="#9AA4B2" style={styles.input} />

        <Text style={styles.label}>Senha</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo de 8 caracteres" placeholderTextColor="#9AA4B2" style={styles.input} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity disabled={!canContinue} onPress={submit} style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>{loading ? 'Aguarde...' : mode === 'register' ? 'Criar conta e continuar' : 'Entrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity disabled={loading} onPress={() => { setError(''); setMode((current) => current === 'register' ? 'login' : 'register'); }} style={styles.switchButton}>
          <Text style={styles.switchText}>{mode === 'register' ? 'Já tenho conta' : 'Quero criar uma conta'}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>A sessão é armazenada de forma segura no dispositivo. Nunca compartilhe sua senha.</Text>

        {!offlineMode ? (
          <>
            <TouchableOpacity onPress={() => { setConfigMessage(''); setConfigOpen((current) => !current); }} style={styles.environmentToggle}>
              <Text style={styles.environmentToggleText}>{configOpen ? 'Ocultar ambiente de homologação' : 'Configurar ambiente de homologação'}</Text>
            </TouchableOpacity>

            {configOpen ? (
              <View style={styles.environmentCard}>
                <Text style={styles.environmentTitle}>Servidor da homologação</Text>
                <Text style={styles.environmentHelp}>Informe a URL completa da API. O aplicativo testa a API e o banco antes de liberar cadastro/login.</Text>
                <TextInput
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="https://servidor.exemplo/v1"
                  placeholderTextColor="#9AA4B2"
                  style={styles.input}
                />
                <TouchableOpacity disabled={configSaving} onPress={saveApiUrl} style={styles.environmentButton}>
                  <Text style={styles.environmentButtonText}>{configSaving ? 'Verificando...' : 'Salvar e testar ambiente'}</Text>
                </TouchableOpacity>
                {configMessage ? <Text style={styles.environmentMessage}>{configMessage}</Text> : null}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.offlineNote}>Nenhuma API, porta pública ou serviço externo é necessário para testar este APK.</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.navy, justifyContent: 'center', padding: 24 },
  brandArea: { alignItems: 'center', marginBottom: 24 },
  logoFrame: { width: 112, height: 112, borderRadius: 24, backgroundColor: theme.colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 },
  logo: { width: 106, height: 106 },
  brand: { color: theme.colors.white, fontSize: 28, fontWeight: '900', letterSpacing: 1.6 },
  tagline: { color: theme.colors.lime, marginTop: 8, fontSize: 12, letterSpacing: 1.1 },
  card: { backgroundColor: theme.colors.white, borderRadius: 28, padding: 22 },
  title: { color: theme.colors.navy, fontSize: 25, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 12 },
  environmentStatus: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  environmentStatusReady: { backgroundColor: '#EDF3E2' },
  environmentStatusPending: { backgroundColor: '#FFF4D6' },
  environmentStatusText: { color: theme.colors.navy, fontSize: 10, fontWeight: '900' },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 10 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: theme.colors.text, backgroundColor: '#F9FBFD' },
  error: { color: theme.colors.danger, marginTop: 12, fontSize: 12, fontWeight: '700' },
  primaryButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 15 },
  switchButton: { alignItems: 'center', paddingVertical: 14 },
  switchText: { color: theme.colors.navy, fontWeight: '800', fontSize: 13 },
  disclaimer: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  environmentToggle: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  environmentToggleText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' },
  environmentCard: { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 8, paddingTop: 14 },
  environmentTitle: { color: theme.colors.navy, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  environmentHelp: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 15, marginBottom: 8 },
  environmentButton: { borderWidth: 1, borderColor: theme.colors.navy, borderRadius: 12, alignItems: 'center', paddingVertical: 11, marginTop: 8 },
  environmentButtonText: { color: theme.colors.navy, fontSize: 12, fontWeight: '900' },
  environmentMessage: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 8, textAlign: 'center' },
  offlineNote: { color: theme.colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12 },
});

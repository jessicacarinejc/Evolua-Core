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
import { getApiBaseUrl, setApiBaseUrl } from '../api/runtime-config';
import { theme } from '../theme';

type Props = {
  onSubmit: (mode: 'login' | 'register', email: string, password: string) => Promise<void>;
};

export function AuthScreen({ onSubmit }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  useEffect(() => {
    void getApiBaseUrl().then(setApiUrl).catch(() => setApiUrl(''));
  }, []);

  const canContinue = email.trim().includes('@') && password.length >= 8 && !loading;

  const submit = async () => {
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
      setConfigMessage('Ambiente de homologação salvo neste dispositivo.');
    } catch (cause) {
      setConfigMessage(cause instanceof Error ? cause.message : 'Não foi possível salvar o ambiente.');
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.brandArea}>
        <Image source={require('../../assets/brand/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>EVOLUA CORE</Text>
        <Text style={styles.tagline}>Treino · Nutrição · Saúde · Evolução</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}</Text>
        <Text style={styles.subtitle}>Seu perfil, restrições e evolução ficam vinculados à sua conta.</Text>

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

        <TouchableOpacity onPress={() => { setConfigMessage(''); setConfigOpen((current) => !current); }} style={styles.environmentToggle}>
          <Text style={styles.environmentToggleText}>{configOpen ? 'Ocultar ambiente de homologação' : 'Configurar ambiente de homologação'}</Text>
        </TouchableOpacity>

        {configOpen ? (
          <View style={styles.environmentCard}>
            <Text style={styles.environmentTitle}>Servidor da homologação</Text>
            <Text style={styles.environmentHelp}>Informe a URL completa da API. Esta configuração fica salva somente neste aparelho e pode ser alterada sem gerar um novo APK.</Text>
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
              <Text style={styles.environmentButtonText}>{configSaving ? 'Salvando...' : 'Salvar ambiente'}</Text>
            </TouchableOpacity>
            {configMessage ? <Text style={styles.environmentMessage}>{configMessage}</Text> : null}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.navy, justifyContent: 'center', padding: 24 },
  brandArea: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 132, height: 132 },
  brand: { color: theme.colors.white, fontSize: 28, fontWeight: '900', letterSpacing: 1.6 },
  tagline: { color: theme.colors.lime, marginTop: 8, fontSize: 12, letterSpacing: 1.1 },
  card: { backgroundColor: theme.colors.white, borderRadius: 28, padding: 22 },
  title: { color: theme.colors.navy, fontSize: 25, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
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
});

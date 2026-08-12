import { useState } from 'react';
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
});

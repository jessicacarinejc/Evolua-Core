import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';

type AssistantResponse = {
  answer: string;
  safety: {
    blocked: boolean;
    reason: string | null;
    requiresProfessionalReview: boolean;
    medicationChangesAllowed: false;
  };
  source: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  blocked?: boolean;
  review?: boolean;
};

export function AssistantScreen({ token }: { token: string | null }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Olá! Posso ajudar a interpretar seus registros, organizar treino, alimentação e recuperação. Antes de responder, aplico regras fixas de segurança. Não altero medicação, insulina nem faço diagnóstico.',
    },
  ]);

  const send = async () => {
    const message = input.trim();
    if (!message || !token || sending) return;

    setInput('');
    setError(null);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text: message }]);
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/assistant/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const text = Array.isArray(payload?.message)
          ? payload.message.join('\n')
          : payload?.message ?? 'Não foi possível consultar o assistente.';
        throw new Error(text);
      }
      const result = payload as AssistantResponse;
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.answer,
          blocked: result.safety.blocked,
          review: result.safety.requiresProfessionalReview,
        },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível consultar o assistente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ASSISTENTE SEGURO</Text>
        <Text style={styles.title}>Evolua Assist</Text>
        <Text style={styles.subtitle}>Orientação baseada nos seus registros, sempre depois das regras determinísticas de segurança.</Text>
      </View>

      <View style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>Limites de segurança</Text>
        <Text style={styles.safetyText}>Nunca altera dose, inicia ou suspende medicação/insulina. Não diagnostica doenças. Sinais de alerta interrompem recomendações automáticas e indicam avaliação profissional.</Text>
      </View>

      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              message.blocked ? styles.blockedBubble : undefined,
            ]}
          >
            <Text style={styles.messageRole}>{message.role === 'user' ? 'VOCÊ' : 'EVOLUA ASSIST'}</Text>
            <Text style={[styles.messageText, message.role === 'user' ? styles.userMessageText : undefined]}>{message.text}</Text>
            {message.review ? <Text style={styles.reviewText}>Revisão profissional recomendada.</Text> : null}
          </View>
        ))}
        {sending ? (
          <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
            <ActivityIndicator color={theme.colors.lime} />
            <Text style={styles.loadingText}>Aplicando regras de segurança e preparando resposta...</Text>
          </View>
        ) : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte sobre treino, alimentação, recuperação ou seus registros"
          placeholderTextColor="#B8C7D9"
          selectionColor={theme.colors.lime}
          style={styles.input}
          multiline
          maxLength={1200}
          editable={!sending && Boolean(token)}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || !token || sending) ? styles.sendButtonDisabled : undefined]}
          onPress={() => void send()}
          disabled={!input.trim() || !token || sending}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 12 },
  eyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: theme.colors.navy, fontSize: 28, fontWeight: '900', marginTop: 4 },
  subtitle: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  safetyCard: { marginHorizontal: theme.spacing.lg, backgroundColor: '#EDF3E2', borderRadius: theme.radius.md, padding: 14 },
  safetyTitle: { color: theme.colors.navy, fontWeight: '900', fontSize: 13 },
  safetyText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  messages: { flex: 1, marginTop: 12 },
  messagesContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: 16, gap: 10 },
  bubble: { borderRadius: theme.radius.md, padding: 14, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.navy },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  blockedBubble: { borderColor: theme.colors.warning, backgroundColor: '#FFF8E8' },
  messageRole: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 },
  messageText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  userMessageText: { color: theme.colors.white },
  reviewText: { color: theme.colors.warning, fontWeight: '800', fontSize: 11, marginTop: 8 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: theme.colors.textMuted, fontSize: 12 },
  error: { color: theme.colors.danger, fontSize: 12, paddingHorizontal: theme.spacing.lg, paddingBottom: 8 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: theme.spacing.lg, paddingTop: 10, paddingBottom: 12, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
  input: { flex: 1, minHeight: 48, maxHeight: 118, borderWidth: 1, borderColor: '#29496D', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 11, color: theme.colors.white, backgroundColor: theme.colors.navyDark, fontSize: 14, lineHeight: 20 },
  sendButton: { backgroundColor: theme.colors.lime, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 15 },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 12 },
});

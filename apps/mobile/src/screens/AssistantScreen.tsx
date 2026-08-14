import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, AssistantResponse } from '../api/client';
import { theme } from '../theme';

type Props = { token: string | null };

type Message = { role: 'user' | 'assistant'; text: string; safety?: AssistantResponse['safety']; provider?: AssistantResponse['provider'] };

export function AssistantScreen({ token }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Posso ajudar com treino, alimentação, hidratação, recuperação e organização de hábitos. Decisões clínicas e ajustes de medicação são sempre bloqueados antes de qualquer IA.' },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const value = input.trim();
    if (!token || !value || loading) return;
    setInput('');
    setMessages((current) => [...current, { role: 'user', text: value }]);
    setLoading(true);
    try {
      const response = await api.askAssistant(token, value);
      setMessages((current) => [...current, { role: 'assistant', text: response.answer, safety: response.safety, provider: response.provider }]);
    } catch (cause) {
      setMessages((current) => [...current, { role: 'assistant', text: cause instanceof Error ? cause.message : 'Não foi possível responder agora.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ASSISTENTE SEGURO</Text>
        <Text style={styles.title}>Evolua Assist</Text>
        <Text style={styles.subtitle}>Regras determinísticas de segurança são aplicadas antes de qualquer resposta de IA.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.messages}>
        {messages.map((message, index) => (
          <View key={`${message.role}-${index}`} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={message.role === 'user' ? styles.userText : styles.assistantText}>{message.text}</Text>
            {message.safety ? <Text style={styles.meta}>{message.safety.note}</Text> : null}
            {message.provider ? <Text style={styles.meta}>Resposta: {message.provider === 'local_ai' ? 'IA local' : 'camada segura determinística'}</Text> : null}
          </View>
        ))}
        {loading ? <ActivityIndicator color={theme.colors.navy} /> : null}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Pergunte sobre treino, alimentação ou recuperação"
          multiline
          maxLength={600}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => void send()} style={styles.button} disabled={!input.trim() || loading || !token}>
          <Text style={styles.buttonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.warning}>O assistente não diagnostica doenças e não altera medicamentos, doses ou insulina.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  eyebrow: { color: theme.colors.navy, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '900', marginTop: 4 },
  subtitle: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  messages: { padding: 16, gap: 10, paddingBottom: 24 },
  bubble: { maxWidth: '88%', borderRadius: 16, padding: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.navy },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  userText: { color: theme.colors.white, fontSize: 13, lineHeight: 19 },
  assistantText: { color: theme.colors.text, fontSize: 13, lineHeight: 19 },
  meta: { color: theme.colors.textMuted, fontSize: 9, lineHeight: 13, marginTop: 7 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
  input: { flex: 1, maxHeight: 100, minHeight: 44, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text },
  button: { backgroundColor: theme.colors.lime, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  buttonText: { color: theme.colors.navyDark, fontWeight: '900' },
  warning: { color: theme.colors.warning, fontSize: 9, lineHeight: 14, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: theme.colors.surface },
});

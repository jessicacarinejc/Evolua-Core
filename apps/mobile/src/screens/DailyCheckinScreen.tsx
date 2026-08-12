import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DailyCheckinInput } from '../api/client';
import { theme } from '../theme';

type Props = {
  defaultMinutes: number;
  defaultPainAreas: string[];
  onSubmit: (input: DailyCheckinInput) => Promise<void>;
  onCancel: () => void;
};

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Scale({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return (
    <View style={styles.scaleRow}>
      {values.map((item) => (
        <TouchableOpacity key={item} onPress={() => onChange(item)} style={[styles.scaleItem, value === item && styles.scaleItemActive]}>
          <Text style={[styles.scaleText, value === item && styles.scaleTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function DailyCheckinScreen({ defaultMinutes, defaultPainAreas, onSubmit, onCancel }: Props) {
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [muscleSoreness, setMuscleSoreness] = useState(2);
  const [jointPain, setJointPain] = useState(0);
  const [availableMinutes, setAvailableMinutes] = useState(defaultMinutes);
  const [painAreas, setPainAreas] = useState<string[]>(defaultPainAreas);
  const [newSymptoms, setNewSymptoms] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePain = (item: string) => {
    setPainAreas((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await onSubmit({ sleepQuality, energyLevel, muscleSoreness, jointPain, availableMinutes, painAreas, newSymptoms, notes: notes.trim() || undefined });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CHECK-IN DIÁRIO</Text>
        <Text style={styles.title}>Como você está hoje?</Text>
        <Text style={styles.subtitle}>Essas respostas ajudam a ajustar duração e intensidade antes de gerar o treino.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Qualidade do sono · 1 ruim, 5 ótima</Text>
        <Scale value={sleepQuality} min={1} max={5} onChange={setSleepQuality} />

        <Text style={styles.label}>Energia · 1 baixa, 5 alta</Text>
        <Scale value={energyLevel} min={1} max={5} onChange={setEnergyLevel} />

        <Text style={styles.label}>Dor muscular · 0 a 10</Text>
        <Scale value={muscleSoreness} min={0} max={10} onChange={setMuscleSoreness} />

        <Text style={styles.label}>Dor articular · 0 a 10</Text>
        <Scale value={jointPain} min={0} max={10} onChange={setJointPain} />

        <Text style={styles.label}>Tempo disponível</Text>
        <View style={styles.wrap}>
          {[20, 30, 45, 60, 75, 90].map((minutes) => (
            <Choice key={minutes} label={`${minutes} min`} active={availableMinutes === minutes} onPress={() => setAvailableMinutes(minutes)} />
          ))}
        </View>

        {defaultPainAreas.length > 0 && (
          <>
            <Text style={styles.label}>Áreas com desconforto hoje</Text>
            <View style={styles.wrap}>
              {defaultPainAreas.map((item) => <Choice key={item} label={item} active={painAreas.includes(item)} onPress={() => togglePain(item)} />)}
            </View>
          </>
        )}

        <Text style={styles.label}>Apareceu algum sintoma novo ou diferente do habitual?</Text>
        <View style={styles.wrap}>
          <Choice label="Não" active={!newSymptoms} onPress={() => setNewSymptoms(false)} />
          <Choice label="Sim" active={newSymptoms} onPress={() => setNewSymptoms(true)} />
        </View>

        <Text style={styles.label}>Observações</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Opcional" style={styles.notes} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {newSymptoms || jointPain >= 7 ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>Atenção</Text>
            <Text style={styles.warningText}>O Evolua Core poderá bloquear a geração automática de treino e recomendar avaliação profissional.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.secondary}><Text style={styles.secondaryText}>Voltar</Text></TouchableOpacity>
        <TouchableOpacity onPress={submit} disabled={loading} style={[styles.primary, loading && styles.disabled]}>
          <Text style={styles.primaryText}>{loading ? 'Salvando...' : 'Salvar check-in'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: theme.colors.navy, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 22 },
  eyebrow: { color: theme.colors.lime, fontWeight: '900', fontSize: 11, letterSpacing: 1.4 },
  title: { color: theme.colors.white, fontSize: 28, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#C8D4E3', fontSize: 13, lineHeight: 19, marginTop: 8 },
  content: { padding: 24, paddingBottom: 38 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '800', marginTop: 16, marginBottom: 10 },
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scaleItem: { minWidth: 35, height: 35, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white, alignItems: 'center', justifyContent: 'center' },
  scaleItemActive: { backgroundColor: theme.colors.lime, borderColor: theme.colors.lime },
  scaleText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
  scaleTextActive: { color: theme.colors.navyDark },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: theme.colors.white },
  choiceActive: { borderColor: theme.colors.lime, backgroundColor: '#EEF7DE' },
  choiceText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  choiceTextActive: { color: theme.colors.navy, fontWeight: '900' },
  notes: { minHeight: 88, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.white, padding: 13, textAlignVertical: 'top', color: theme.colors.text },
  error: { color: theme.colors.danger, marginTop: 14, fontSize: 12, fontWeight: '700' },
  warning: { backgroundColor: '#FFF4E5', padding: 16, borderRadius: 16, marginTop: 18 },
  warningTitle: { color: theme.colors.warning, fontWeight: '900' },
  warningText: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.white },
  secondary: { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border },
  secondaryText: { color: theme.colors.navy, fontWeight: '800' },
  primary: { flex: 1, backgroundColor: theme.colors.lime, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  primaryText: { color: theme.colors.navyDark, fontWeight: '900' },
  disabled: { opacity: 0.5 },
});

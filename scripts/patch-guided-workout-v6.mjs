import fs from 'node:fs';

const screenPath = 'apps/mobile/src/screens/WorkoutExecutionScreen.tsx';
const appPath = 'apps/mobile/app.json';

let source = fs.readFileSync(screenPath, 'utf8');

function replaceOnce(label, from, to) {
  if (!source.includes(from)) {
    throw new Error(`Trecho não encontrado para ${label}`);
  }
  source = source.replace(from, to);
}

replaceOnce(
  'estado de preparação',
  "  const [workRemaining, setWorkRemaining] = useState(0);\n  const [workRunning, setWorkRunning] = useState(false);",
  "  const [workRemaining, setWorkRemaining] = useState(0);\n  const [workRunning, setWorkRunning] = useState(false);\n  const [prepareRemaining, setPrepareRemaining] = useState(0);",
);

replaceOnce(
  'opções rápidas de feedback',
  "const safetyTypeLabels: Record<SafetyInputType, string> = {\n  pain: 'Dor/desconforto',\n  dizziness: 'Tontura',\n  shortness_of_breath: 'Falta de ar incomum',\n  other: 'Outro sintoma',\n};",
  "const safetyTypeLabels: Record<SafetyInputType, string> = {\n  pain: 'Dor/desconforto',\n  dizziness: 'Tontura',\n  shortness_of_breath: 'Falta de ar incomum',\n  other: 'Outro sintoma',\n};\n\nconst quickFeedbackOptions = [\n  { label: 'Muito fácil', rpe: '3' },\n  { label: 'Fácil', rpe: '5' },\n  { label: 'Adequado', rpe: '7' },\n  { label: 'Difícil', rpe: '8' },\n  { label: 'Muito difícil', rpe: '9' },\n] as const;",
);

replaceOnce(
  'cronômetro de preparação',
  "  useEffect(() => {\n    if (!workRunning || workRemaining <= 0) return;\n    const timer = setInterval(() => {\n      setWorkRemaining((value) => {\n        const next = Math.max(0, value - 1);\n        if (next === 0) setWorkRunning(false);\n        return next;\n      });\n    }, 1000);\n    return () => clearInterval(timer);\n  }, [workRemaining, workRunning]);",
  "  useEffect(() => {\n    if (!workRunning || workRemaining <= 0) return;\n    const timer = setInterval(() => {\n      setWorkRemaining((value) => {\n        const next = Math.max(0, value - 1);\n        if (next === 0) setWorkRunning(false);\n        return next;\n      });\n    }, 1000);\n    return () => clearInterval(timer);\n  }, [workRemaining, workRunning]);\n\n  useEffect(() => {\n    if (!isCircuit || prepareRemaining <= 0 || !currentExercise?.durationSeconds || restRemaining > 0) return;\n    const timer = setInterval(() => {\n      setPrepareRemaining((value) => {\n        const next = Math.max(0, value - 1);\n        if (next === 0) setWorkRunning(true);\n        return next;\n      });\n    }, 1000);\n    return () => clearInterval(timer);\n  }, [currentExercise?.id, isCircuit, prepareRemaining, restRemaining]);",
);

replaceOnce(
  'reinício por exercício',
  "    setWorkRemaining(currentExercise.durationSeconds ?? 0);\n    setWorkRunning(false);",
  "    setWorkRemaining(currentExercise.durationSeconds ?? 0);\n    setPrepareRemaining(isCircuit && currentExercise.durationSeconds ? 5 : 0);\n    setWorkRunning(false);",
);

replaceOnce(
  'cartão de descanso',
  "        <View style={styles.restCard}>\n          <Text style={styles.restLabel}>{isCircuit && restRemaining > 20 ? 'DESCANSO ENTRE ROUNDS' : 'DESCANSO'}</Text>\n          <Text style={styles.restValue}>{restRemaining}s</Text>\n          <TouchableOpacity onPress={() => setRestRemaining(0)} style={styles.restButton}>\n            <Text style={styles.restButtonText}>Pular descanso</Text>\n          </TouchableOpacity>\n        </View>",
  "        <View style={styles.restCard}>\n          <Text style={styles.restLabel}>{isCircuit && restRemaining > 20 ? 'DESCANSO ENTRE ROUNDS' : 'DESCANSO'}</Text>\n          <Text style={styles.restValue}>{restRemaining}s</Text>\n          {currentExercise ? (\n            <View style={styles.restNextCard}>\n              <Text style={styles.restNextEyebrow}>PRÓXIMO</Text>\n              <Text style={styles.restNextName}>{currentExercise.name}</Text>\n              <Text style={styles.restNextMeta}>{currentExercise.primaryMuscle}</Text>\n            </View>\n          ) : null}\n          <View style={styles.restActions}>\n            <TouchableOpacity onPress={() => setRestRemaining((value) => value + 30)} style={styles.restSecondaryButton}>\n              <Text style={styles.restSecondaryButtonText}>+30 segundos</Text>\n            </TouchableOpacity>\n            <TouchableOpacity onPress={() => setRestRemaining(0)} style={styles.restButton}>\n              <Text style={styles.restButtonText}>Pular</Text>\n            </TouchableOpacity>\n          </View>\n        </View>",
);

replaceOnce(
  'cartão de exercício cronometrado',
  "          {currentExercise.durationSeconds ? (\n            <View style={styles.timedCard}>\n              <Text style={styles.timedLabel}>{workRemaining > 0 ? 'TEMPO DO BLOCO' : 'BLOCO CONCLUÍDO'}</Text>\n              <Text style={styles.timedValue}>{workRemaining}s</Text>\n              {workRemaining > 0 ? (\n                <TouchableOpacity\n                  disabled={restRemaining > 0}\n                  onPress={() => setWorkRunning((value) => !value)}\n                  style={[styles.timerButton, restRemaining > 0 && styles.disabled]}\n                >\n                  <Text style={styles.timerButtonText}>{workRunning ? 'Pausar' : workRemaining === currentExercise.durationSeconds ? 'Iniciar' : 'Continuar'}</Text>\n                </TouchableOpacity>\n              ) : (\n                <Text style={styles.timedText}>Tempo cumprido. Registre o bloco para avançar.</Text>\n              )}\n            </View>\n          ) : (",
  "          {currentExercise.durationSeconds ? (\n            <View style={styles.timedCard}>\n              {prepareRemaining > 0 ? (\n                <>\n                  <Text style={styles.prepareEyebrow}>PREPARE-SE</Text>\n                  <Text style={styles.prepareValue}>{prepareRemaining}</Text>\n                  <Text style={styles.prepareText}>O exercício começa automaticamente quando a contagem chegar a zero.</Text>\n                  <TouchableOpacity\n                    onPress={() => {\n                      setPrepareRemaining(0);\n                      setWorkRunning(true);\n                    }}\n                    style={styles.prepareSkipButton}\n                  >\n                    <Text style={styles.prepareSkipButtonText}>Começar agora</Text>\n                  </TouchableOpacity>\n                </>\n              ) : (\n                <>\n                  <Text style={styles.timedLabel}>{workRemaining > 0 ? 'TEMPO DO BLOCO' : 'BLOCO CONCLUÍDO'}</Text>\n                  <Text style={styles.timedValue}>{workRemaining}s</Text>\n                  {workRemaining > 0 ? (\n                    <TouchableOpacity\n                      disabled={restRemaining > 0}\n                      onPress={() => setWorkRunning((value) => !value)}\n                      style={[styles.timerButton, restRemaining > 0 && styles.disabled]}\n                    >\n                      <Text style={styles.timerButtonText}>{workRunning ? 'Pausar' : workRemaining === currentExercise.durationSeconds ? 'Iniciar' : 'Continuar'}</Text>\n                    </TouchableOpacity>\n                  ) : (\n                    <Text style={styles.timedText}>Tempo cumprido. Toque em concluir para avançar com segurança.</Text>\n                  )}\n                </>\n              )}\n            </View>\n          ) : (",
);

replaceOnce(
  'feedback pós-treino',
  "          <Text style={styles.inputLabel}>Esforço geral (RPE 1–10)</Text>\n          <TextInput value={perceivedEffort} onChangeText={setPerceivedEffort} keyboardType=\"number-pad\" style={styles.fullInput} placeholder=\"7\" />\n          <Text style={styles.inputLabel}>Como foi o treino? (opcional)</Text>",
  "          <Text style={styles.inputLabel}>Como foi o treino?</Text>\n          <View style={styles.quickFeedbackWrap}>\n            {quickFeedbackOptions.map((option) => {\n              const selected = feedback === option.label;\n              return (\n                <TouchableOpacity\n                  key={option.label}\n                  onPress={() => {\n                    setFeedback(option.label);\n                    setPerceivedEffort(option.rpe);\n                  }}\n                  style={[styles.quickFeedbackButton, selected && styles.quickFeedbackButtonActive]}\n                >\n                  <Text style={[styles.quickFeedbackText, selected && styles.quickFeedbackTextActive]}>{option.label}</Text>\n                </TouchableOpacity>\n              );\n            })}\n          </View>\n          <Text style={styles.inputLabel}>Esforço geral (RPE 1–10)</Text>\n          <TextInput value={perceivedEffort} onChangeText={setPerceivedEffort} keyboardType=\"number-pad\" style={styles.fullInput} placeholder=\"7\" />\n          <Text style={styles.inputLabel}>Comentário adicional (opcional)</Text>",
);

replaceOnce(
  'estilos do descanso',
  "  restButton: { paddingVertical: 8, paddingHorizontal: 16 },\n  restButtonText: { color: '#C8D4E3', fontWeight: '800', fontSize: 12 },",
  "  restNextCard: { width: '100%', backgroundColor: '#173B65', borderRadius: 14, padding: 12, marginTop: 6, marginBottom: 10 },\n  restNextEyebrow: { color: theme.colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },\n  restNextName: { color: theme.colors.white, fontSize: 15, fontWeight: '900', marginTop: 3 },\n  restNextMeta: { color: '#AFC1D5', fontSize: 10, marginTop: 2, textTransform: 'capitalize' },\n  restActions: { flexDirection: 'row', gap: 8, marginTop: 2 },\n  restButton: { backgroundColor: '#24486F', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },\n  restButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 11 },\n  restSecondaryButton: { borderWidth: 1, borderColor: '#476A8D', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },\n  restSecondaryButtonText: { color: '#C8D4E3', fontWeight: '900', fontSize: 11 },",
);

replaceOnce(
  'estilos do preparo',
  "  timedCard: { backgroundColor: '#EDF3E2', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },\n  timedLabel: { color: theme.colors.navy, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },",
  "  timedCard: { backgroundColor: '#EDF3E2', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },\n  prepareEyebrow: { color: theme.colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },\n  prepareValue: { color: theme.colors.navy, fontSize: 56, fontWeight: '900', lineHeight: 64, marginTop: 2 },\n  prepareText: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center', maxWidth: 260 },\n  prepareSkipButton: { backgroundColor: theme.colors.navy, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 18, marginTop: 10 },\n  prepareSkipButtonText: { color: theme.colors.white, fontSize: 10, fontWeight: '900' },\n  timedLabel: { color: theme.colors.navy, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },",
);

replaceOnce(
  'estilos de feedback',
  "  feedbackInput: { minHeight: 84, textAlignVertical: 'top' },",
  "  quickFeedbackWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },\n  quickFeedbackButton: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#F7F9FB', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 11 },\n  quickFeedbackButtonActive: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },\n  quickFeedbackText: { color: theme.colors.textMuted, fontSize: 9, fontWeight: '800' },\n  quickFeedbackTextActive: { color: theme.colors.white },\n  feedbackInput: { minHeight: 84, textAlignVertical: 'top' },",
);

fs.writeFileSync(screenPath, source);

const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
app.expo.version = '0.1.8';
app.expo.ios.buildNumber = '9';
app.expo.android.versionCode = 9;
fs.writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);

console.log('Treino guiado v6 aplicado com sucesso.');

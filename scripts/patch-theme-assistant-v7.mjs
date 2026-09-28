import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), 'utf8');
}

function write(rel, content) {
  fs.mkdirSync(path.dirname(file(rel)), { recursive: true });
  fs.writeFileSync(file(rel), content);
}

function replaceRequired(content, from, to, label) {
  if (content.includes(to)) return content;
  if (!content.includes(from)) throw new Error(`Não encontrei trecho obrigatório: ${label}`);
  return content.replace(from, to);
}

function replaceAll(content, from, to) {
  return content.split(from).join(to);
}

const themeContent = `import { DynamicColorIOS, Platform, PlatformColor } from 'react-native';

function adaptiveColor(light: string, dark: string, androidAttribute: string) {
  if (Platform.OS === 'ios') return DynamicColorIOS({ light, dark });
  if (Platform.OS === 'android') return PlatformColor(androidAttribute);
  return light;
}

const background = adaptiveColor('#FBFAF7', '#0D1117', '?android:attr/colorBackground');
const surface = adaptiveColor('#FFFFFF', '#171C24', '?android:attr/colorBackgroundFloating');
const text = adaptiveColor('#1A2433', '#F4F6F8', '?android:attr/textColorPrimary');
const textMuted = adaptiveColor('#737D8B', '#B6BEC9', '?android:attr/textColorSecondary');
const inputSurface = adaptiveColor('#FFFFFF', '#151B23', '?android:attr/colorBackgroundFloating');

export const theme = {
  colors: {
    navy: '#10294B',
    navyDark: '#0B1E38',
    lime: '#9DCC46',
    white: '#FFFFFF',
    background,
    surface,
    inputSurface,
    text,
    textStrong: text,
    textMuted,
    placeholder: textMuted,
    border: 'rgba(128, 136, 148, 0.24)',
    borderStrong: 'rgba(94, 108, 126, 0.48)',
    tintSurface: 'rgba(157, 204, 70, 0.12)',
    warningSurface: 'rgba(199, 120, 0, 0.12)',
    success: '#2E7D32',
    warning: '#C77800',
    danger: '#B3261E'
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
} as const;
`;
write('apps/mobile/src/theme.ts', themeContent);

const appearanceContent = `import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

export type AppearancePreference = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = 'evolua_core_appearance_preference';
const VALID = new Set<AppearancePreference>(['system', 'light', 'dark']);

export function applyAppearancePreference(preference: AppearancePreference) {
  Appearance.setColorScheme(preference === 'system' ? null : preference);
}

export async function loadAppearancePreference(): Promise<AppearancePreference> {
  const saved = await SecureStore.getItemAsync(APPEARANCE_KEY);
  const preference = saved && VALID.has(saved as AppearancePreference)
    ? saved as AppearancePreference
    : 'system';
  applyAppearancePreference(preference);
  return preference;
}

export async function saveAppearancePreference(preference: AppearancePreference) {
  await SecureStore.setItemAsync(APPEARANCE_KEY, preference);
  applyAppearancePreference(preference);
}
`;
write('apps/mobile/src/appearance.ts', appearanceContent);

let assistant = read('apps/mobile/src/screens/AssistantScreen.tsx');
assistant = replaceRequired(
  assistant,
  "import { theme } from '../theme';\n\nconst API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3333/v1';",
  "import { getApiBaseUrl } from '../api/runtime-config';\nimport { theme } from '../theme';",
  'import da API no AssistantScreen',
);
assistant = replaceRequired(
  assistant,
  "      const response = await fetch(`${API_URL}/assistant/ask`, {",
  "      const apiUrl = await getApiBaseUrl();\n      const response = await fetch(`${apiUrl}/assistant/ask`, {",
  'URL dinâmica da assistente',
);
assistant = replaceAll(assistant, 'placeholderTextColor="#B8C7D9"', 'placeholderTextColor={theme.colors.placeholder}');
assistant = replaceAll(assistant, "backgroundColor: '#EDF3E2'", 'backgroundColor: theme.colors.tintSurface');
assistant = replaceAll(assistant, "backgroundColor: '#FFF8E8'", 'backgroundColor: theme.colors.warningSurface');
assistant = replaceAll(assistant, "borderColor: '#29496D'", 'borderColor: theme.colors.borderStrong');
assistant = replaceAll(assistant, 'color: theme.colors.white, backgroundColor: theme.colors.navyDark', 'color: theme.colors.text, backgroundColor: theme.colors.inputSurface');
write('apps/mobile/src/screens/AssistantScreen.tsx', assistant);

let app = read('apps/mobile/App.tsx');
app = replaceRequired(
  app,
  "  TouchableOpacity,\n  View,\n} from 'react-native';",
  "  TouchableOpacity,\n  View,\n  useColorScheme,\n} from 'react-native';",
  'useColorScheme no App',
);
app = replaceRequired(
  app,
  "import { api, DailyCheckinInput, DailyCheckinResult } from './src/api/client';",
  "import { api, DailyCheckinInput, DailyCheckinResult } from './src/api/client';\nimport { AppearancePreference, loadAppearancePreference, saveAppearancePreference } from './src/appearance';",
  'import de aparência no App',
);
app = replaceRequired(
  app,
  "  const [bootRetrying, setBootRetrying] = useState(false);",
  "  const [bootRetrying, setBootRetrying] = useState(false);\n  const [appearancePreference, setAppearancePreference] = useState<AppearancePreference>('system');\n  const colorScheme = useColorScheme();",
  'estado de aparência no App',
);
app = replaceRequired(
  app,
  "  useEffect(() => {\n    void restoreSession();\n  }, []);",
  "  useEffect(() => {\n    void loadAppearancePreference().then(setAppearancePreference);\n    void restoreSession();\n  }, []);",
  'carregamento de aparência no App',
);
app = replaceRequired(
  app,
  "  const handleCheckin = async (input: DailyCheckinInput) => {",
  "  const handleAppearanceChange = async (next: AppearancePreference) => {\n    setAppearancePreference(next);\n    await saveAppearancePreference(next);\n  };\n\n  const handleCheckin = async (input: DailyCheckinInput) => {",
  'handler de aparência no App',
);
app = replaceRequired(
  app,
  "    return <ProfileScreen token={token} profile={profile} onProfileUpdated={setProfile} />;",
  "    return <ProfileScreen token={token} profile={profile} onProfileUpdated={setProfile} appearancePreference={appearancePreference} onAppearanceChange={handleAppearanceChange} />;",
  'props de aparência no ProfileScreen',
);
app = replaceRequired(
  app,
  "  }, [activeTab, profile, recovery, token]);",
  "  }, [activeTab, profile, recovery, token, appearancePreference]);",
  'dependência de aparência no screen memo',
);
app = replaceAll(app, '<StatusBar style="dark" />', '<StatusBar style={colorScheme === \'dark\' ? \'light\' : \'dark\'} />');
write('apps/mobile/App.tsx', app);

let profile = read('apps/mobile/src/screens/ProfileScreen.tsx');
profile = replaceRequired(
  profile,
  "import { api } from '../api/client';",
  "import { api } from '../api/client';\nimport type { AppearancePreference } from '../appearance';",
  'tipo de aparência no ProfileScreen',
);
profile = replaceRequired(
  profile,
  "  onProfileUpdated: (profile: OnboardingData) => void;\n};",
  "  onProfileUpdated: (profile: OnboardingData) => void;\n  appearancePreference: AppearancePreference;\n  onAppearanceChange: (preference: AppearancePreference) => void;\n};",
  'props de aparência no ProfileScreen',
);
profile = replaceRequired(
  profile,
  'export function ProfileScreen({ token, profile, onProfileUpdated }: Props) {',
  'export function ProfileScreen({ token, profile, onProfileUpdated, appearancePreference, onAppearanceChange }: Props) {',
  'assinatura do ProfileScreen',
);
profile = replaceRequired(
  profile,
  "      <Text style={styles.subtitle}>Alterações de objetivo, disponibilidade, equipamentos, dores e restrições passam a ser consideradas nas próximas recomendações automáticas.</Text>\n\n      <View style={styles.card}>\n        <Text style={styles.sectionTitle}>Dados pessoais</Text>",
  "      <Text style={styles.subtitle}>Alterações de objetivo, disponibilidade, equipamentos, dores e restrições passam a ser consideradas nas próximas recomendações automáticas.</Text>\n\n      <View style={styles.card}>\n        <Text style={styles.sectionTitle}>Aparência</Text>\n        <Text style={styles.helper}>Use o tema claro mais leve, o escuro ou acompanhe automaticamente o celular.</Text>\n        <View style={styles.chips}>\n          {([\n            { key: 'light', label: 'Claro' },\n            { key: 'dark', label: 'Escuro' },\n            { key: 'system', label: 'Sistema' },\n          ] as const).map((option) => (\n            <TouchableOpacity key={option.key} onPress={() => onAppearanceChange(option.key)} style={[styles.chip, appearancePreference === option.key && styles.chipActive]}>\n              <Text style={[styles.chipText, appearancePreference === option.key && styles.chipTextActive]}>{option.label}</Text>\n            </TouchableOpacity>\n          ))}\n        </View>\n      </View>\n\n      <View style={styles.card}>\n        <Text style={styles.sectionTitle}>Dados pessoais</Text>",
  'card de aparência no ProfileScreen',
);
write('apps/mobile/src/screens/ProfileScreen.tsx', profile);

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
}

const themedFiles = [file('apps/mobile/App.tsx'), ...walk(file('apps/mobile/src'))]
  .filter((item) => item.endsWith('.tsx'));

for (const absolute of themedFiles) {
  let source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes('theme.colors')) continue;
  source = replaceAll(source, 'color: theme.colors.navy,', 'color: theme.colors.textStrong,');
  source = replaceAll(source, 'backgroundColor: theme.colors.white,', 'backgroundColor: theme.colors.surface,');
  source = replaceAll(source, "backgroundColor: '#FFFFFF',", 'backgroundColor: theme.colors.surface,');
  source = replaceAll(source, "backgroundColor: '#F5F7FA',", 'backgroundColor: theme.colors.background,');
  source = replaceAll(source, "backgroundColor: '#F9FBFD',", 'backgroundColor: theme.colors.inputSurface,');
  source = replaceAll(source, "backgroundColor: '#EDF3E2',", 'backgroundColor: theme.colors.tintSurface,');
  source = replaceAll(source, "backgroundColor: '#EEF7DE',", 'backgroundColor: theme.colors.tintSurface,');
  source = replaceAll(source, "backgroundColor: '#FFF8E8',", 'backgroundColor: theme.colors.warningSurface,');
  source = replaceAll(source, "borderColor: '#29496D',", 'borderColor: theme.colors.borderStrong,');
  fs.writeFileSync(absolute, source);
}

const appJsonPath = 'apps/mobile/app.json';
const appJson = JSON.parse(read(appJsonPath));
appJson.expo.version = '0.1.9';
appJson.expo.ios.buildNumber = '11';
appJson.expo.android.versionCode = 11;
write(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

console.log('Tema adaptativo, seletor de aparência e correção da Assistente aplicados.');

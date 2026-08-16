import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';
import { guidanceUrl } from '../workouts/exercise-guidance';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';

type Props = {
  name: string;
  videoUrl?: string | null;
  license?: string | null;
  attribution?: string | null;
};

export function ExerciseGuidancePreview({ name, videoUrl, license, attribution }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={() => setOpen((value) => !value)} style={[styles.button, open && styles.buttonOpen]}>
        <View style={styles.icon}><Text style={styles.iconText}>{open ? '▾' : '▶'}</Text></View>
        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>DEMONSTRAÇÃO + TÉCNICA</Text>
          <Text style={styles.title}>{open ? 'Ocultar orientação' : 'Ver como fazer este exercício'}</Text>
          {!open ? <Text style={styles.subtitle}>Movimento · respiração · iniciante · erros comuns</Text> : null}
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>GUIADO</Text></View>
      </TouchableOpacity>
      {open ? (
        <ExerciseVideoPlayer
          title={name}
          videoUrl={videoUrl ?? guidanceUrl(name)}
          license={license}
          attribution={attribution}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF3E2', borderRadius: 18, padding: 13, borderWidth: 1, borderColor: '#DCE9C5' },
  buttonOpen: { backgroundColor: '#E5F2CE', borderColor: '#CBE19E' },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  iconText: { color: theme.colors.lime, fontSize: 13, fontWeight: '900' },
  textWrap: { flex: 1 },
  eyebrow: { color: theme.colors.success, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { color: theme.colors.navy, fontSize: 13, fontWeight: '900', marginTop: 2 },
  subtitle: { color: theme.colors.textMuted, fontSize: 9, marginTop: 3 },
  badge: { backgroundColor: theme.colors.lime, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  badgeText: { color: theme.colors.navyDark, fontSize: 8, fontWeight: '900' },
});
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { theme } from '../theme';

type Props = {
  title: string;
  videoUrl: string;
  license?: string | null;
  attribution?: string | null;
};

export function ExerciseVideoPlayer({ title, videoUrl, license, attribution }: Props) {
  const player = useVideoPlayer(videoUrl);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" allowsFullscreen />
      {license ? <Text style={styles.meta}>Licença: {license}</Text> : null}
      {attribution ? <Text style={styles.meta}>Crédito: {attribution}</Text> : null}
      {!license && !attribution ? <Text style={styles.warning}>Revisar licença da mídia antes da homologação final.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.navy, borderRadius: 18, padding: 14, marginVertical: 10 },
  title: { color: theme.colors.white, fontSize: 14, fontWeight: '900', marginBottom: 10 },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#07182C', borderRadius: 12 },
  meta: { color: '#C8D4E3', fontSize: 9, lineHeight: 14, marginTop: 5 },
  warning: { color: '#FFD5D5', fontSize: 9, lineHeight: 14, marginTop: 7 },
});

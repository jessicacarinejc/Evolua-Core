import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ExerciseMotionAvatar } from './ExerciseMotionAvatar';
import { getExerciseGuidance } from '../workouts/exercise-guidance';
import { resolveExerciseMedia } from '../workouts/exercise-media';
import { theme } from '../theme';

type Props = {
  title: string;
  videoUrl: string;
  license?: string | null;
  attribution?: string | null;
};

function InlineVideo({ source }: { source: string | number }) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.media}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
    />
  );
}

function GuidedMotion({ title }: { title: string }) {
  const guidance = useMemo(() => getExerciseGuidance(title), [title]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;
  const phase = guidance.phases[phaseIndex] ?? guidance.phases[0] ?? {
    title: 'Posição inicial',
    cue: 'Posicione-se com estabilidade e execute o movimento de forma controlada.',
    breathing: 'Respire naturalmente e evite prender a respiração.',
  };

  useEffect(() => {
    if (!playing) return;
    const interval = slow ? 5000 : 3200;
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -6, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        setPhaseIndex((current) => (current + 1) % guidance.phases.length);
        translate.setValue(6);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 190, useNativeDriver: true }),
          Animated.timing(translate, { toValue: 0, duration: 190, useNativeDriver: true }),
        ]).start();
      });
    }, interval);
    return () => clearInterval(timer);
  }, [guidance.phases.length, opacity, playing, slow, translate]);

  const goTo = (index: number) => {
    setPhaseIndex(index);
    setPlaying(false);
  };

  return (
    <View style={styles.guide}>
      <View style={styles.guideTopRow}>
        <View style={styles.guideHeading}>
          <Text style={styles.guideEyebrow}>DEMONSTRAÇÃO ANIMADA · OFFLINE</Text>
          <Text style={styles.guideTitle}>Movimento contínuo + 4 fases explicadas</Text>
        </View>
        <View style={styles.guideControls}>
          <TouchableOpacity onPress={() => setSlow((value) => !value)} style={[styles.speedButton, slow && styles.speedButtonActive]}>
            <Text style={[styles.speedButtonText, slow && styles.speedButtonTextActive]}>{slow ? '0,5×' : '1×'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPlaying((value) => !value)} style={styles.playButton}>
            <Text style={styles.playButtonText}>{playing ? 'Pausar' : 'Reproduzir'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stage}>
        <ExerciseMotionAvatar pose={guidance.pose} slow={slow} playing={playing} />
        <Animated.View style={[styles.phaseTextWrap, { opacity, transform: [{ translateY: translate }] }]}>
          <Text style={styles.phaseCounter}>FASE {phaseIndex + 1} DE 4</Text>
          <Text style={styles.phaseTitle}>{phase.title}</Text>
          <Text style={styles.phaseCue}>{phase.cue}</Text>
          <Text style={styles.breathing}>Respiração: {phase.breathing}</Text>
        </Animated.View>
      </View>

      <View style={styles.phaseDots}>
        {guidance.phases.map((item, index) => (
          <TouchableOpacity
            key={`${item.title}-${index}`}
            onPress={() => goTo(index)}
            style={[styles.phaseDot, index === phaseIndex && styles.phaseDotActive]}
          >
            <Text style={[styles.phaseDotText, index === phaseIndex && styles.phaseDotTextActive]}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.beginnerCard}>
        <Text style={styles.beginnerTitle}>Para quem está começando</Text>
        <Text style={styles.beginnerText}>{guidance.beginnerTip}</Text>
      </View>
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>Evite estes erros</Text>
        <Text style={styles.errorText}>{guidance.commonErrors}</Text>
      </View>
    </View>
  );
}

export function ExerciseVideoPlayer({ title, videoUrl, license, attribution }: Props) {
  const media = resolveExerciseMedia(title, videoUrl);
  const hasRealClip = media.kind === 'local-clip' || media.kind === 'remote-video' || media.kind === 'remote-image';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {hasRealClip ? (
        <View style={styles.referenceWrap}>
          <Text style={styles.referenceTitle}>{media.kind === 'local-clip' ? 'VÍDEO OFFLINE DO EXERCÍCIO' : 'REFERÊNCIA COMPLEMENTAR'}</Text>
          {media.kind === 'remote-image' ? (
            <Image source={{ uri: media.source }} style={styles.media} resizeMode="contain" />
          ) : media.kind === 'local-clip' || media.kind === 'remote-video' ? (
            <InlineVideo source={media.source} />
          ) : null}
          {license ? <Text style={styles.meta}>Licença: {license}</Text> : null}
          {attribution ? <Text style={styles.meta}>Crédito: {attribution}</Text> : null}
          {media.kind !== 'local-clip' && !license && !attribution ? <Text style={styles.warning}>Mídia complementar pendente de revisão de licença.</Text> : null}
        </View>
      ) : (
        <View style={styles.clipPendingCard}>
          <Text style={styles.clipPendingTitle}>Vídeo real deste exercício ainda não entrou no APK</Text>
          <Text style={styles.clipPendingText}>Enquanto o acervo final é produzido/licenciado, a demonstração animada abaixo é contínua e própria do Evolua Core. Ela não é apresentada como substituta do vídeo final.</Text>
        </View>
      )}

      <GuidedMotion title={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.navy, borderRadius: 24, padding: 14, marginVertical: 12 },
  title: { color: theme.colors.white, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  guide: { backgroundColor: '#102A4D', borderRadius: 18, padding: 14 },
  guideTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  guideHeading: { flex: 1 },
  guideEyebrow: { color: theme.colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  guideTitle: { color: theme.colors.white, fontSize: 13, fontWeight: '900', marginTop: 3 },
  guideControls: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  speedButton: { borderWidth: 1, borderColor: '#55708D', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999 },
  speedButtonActive: { borderColor: theme.colors.lime, backgroundColor: '#183B62' },
  speedButtonText: { color: '#C8D4E3', fontSize: 9, fontWeight: '900' },
  speedButtonTextActive: { color: theme.colors.lime },
  playButton: { backgroundColor: theme.colors.lime, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  playButtonText: { color: theme.colors.navyDark, fontSize: 9, fontWeight: '900' },
  stage: { flexDirection: 'row', alignItems: 'center', minHeight: 188, marginTop: 12, backgroundColor: '#071B34', borderRadius: 16, padding: 12, gap: 13 },
  phaseTextWrap: { flex: 1 },
  phaseCounter: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  phaseTitle: { color: theme.colors.white, fontSize: 17, fontWeight: '900', marginTop: 4 },
  phaseCue: { color: '#D7E2EF', fontSize: 11, lineHeight: 17, marginTop: 6 },
  breathing: { color: '#A9BBD0', fontSize: 10, lineHeight: 15, marginTop: 7, fontWeight: '700' },
  phaseDots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 12 },
  phaseDot: { width: 33, height: 33, borderRadius: 17, borderWidth: 1, borderColor: '#486482', alignItems: 'center', justifyContent: 'center' },
  phaseDotActive: { backgroundColor: theme.colors.lime, borderColor: theme.colors.lime },
  phaseDotText: { color: '#C8D4E3', fontWeight: '900', fontSize: 11 },
  phaseDotTextActive: { color: theme.colors.navyDark },
  beginnerCard: { backgroundColor: '#203E63', borderRadius: 13, padding: 12, marginTop: 12 },
  beginnerTitle: { color: theme.colors.lime, fontSize: 10, fontWeight: '900' },
  beginnerText: { color: '#E4ECF5', fontSize: 10, lineHeight: 16, marginTop: 4 },
  errorCard: { backgroundColor: '#402B35', borderRadius: 13, padding: 12, marginTop: 8 },
  errorTitle: { color: '#FFD08A', fontSize: 10, fontWeight: '900' },
  errorText: { color: '#F3DFE6', fontSize: 10, lineHeight: 16, marginTop: 4 },
  referenceWrap: { marginBottom: 12 },
  referenceTitle: { color: '#C8D4E3', fontSize: 9, fontWeight: '900', marginBottom: 7, letterSpacing: 0.8 },
  clipPendingCard: { backgroundColor: '#183B62', borderRadius: 14, padding: 12, marginBottom: 12 },
  clipPendingTitle: { color: theme.colors.lime, fontSize: 10, fontWeight: '900' },
  clipPendingText: { color: '#D2DEEB', fontSize: 9, lineHeight: 14, marginTop: 4 },
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#07182C', borderRadius: 12 },
  meta: { color: '#C8D4E3', fontSize: 9, lineHeight: 14, marginTop: 5 },
  warning: { color: '#FFD5D5', fontSize: 9, lineHeight: 14, marginTop: 7 },
});

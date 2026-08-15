import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getExerciseGuidance } from '../workouts/exercise-guidance';
import { theme } from '../theme';

type Props = {
  title: string;
  videoUrl: string;
  license?: string | null;
  attribution?: string | null;
};

const poseEmoji: Record<string, string> = {
  squat: '🏋️',
  press: '🏋️',
  pull: '🧍',
  hinge: '🧍',
  curl: '💪',
  pushdown: '💪',
  'core-supine': '🧘',
  quadruped: '🤸',
  calf: '🧍',
  bike: '🚴',
  pushup: '🤸',
  'jumping-jack': '🤸',
  dip: '💪',
  'high-knees': '🏃',
  'tai-chi': '🧘',
  walk: '🚶',
  lunge: '🧘',
};

function InlineVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
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
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;
  const phase = guidance.phases[phaseIndex];

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -8, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setPhaseIndex((current) => (current + 1) % guidance.phases.length);
        translate.setValue(8);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(translate, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start();
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [guidance.phases.length, opacity, playing, translate]);

  const goTo = (index: number) => {
    setPhaseIndex(index);
    setPlaying(false);
  };

  return (
    <View style={styles.guide}>
      <View style={styles.guideTopRow}>
        <View>
          <Text style={styles.guideEyebrow}>VÍDEO GUIADO · INICIANTE</Text>
          <Text style={styles.guideTitle}>Veja cada fase antes de executar</Text>
        </View>
        <TouchableOpacity onPress={() => setPlaying((value) => !value)} style={styles.playButton}>
          <Text style={styles.playButtonText}>{playing ? 'Pausar' : 'Reproduzir'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stage}>
        <View style={styles.poseHalo}>
          <Animated.Text style={[styles.pose, { opacity, transform: [{ translateY: translate }] }]}>
            {poseEmoji[guidance.pose] ?? '🏃'}
          </Animated.Text>
        </View>
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
  const isLocalGuide = videoUrl.startsWith('evolua-guide://');
  const isAnimatedImage = /\.gif(?:\?|$)/i.test(videoUrl);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <GuidedMotion title={title} />

      {!isLocalGuide ? (
        <View style={styles.referenceWrap}>
          <Text style={styles.referenceTitle}>Demonstração complementar</Text>
          {isAnimatedImage ? (
            <Image source={{ uri: videoUrl }} style={styles.media} resizeMode="contain" />
          ) : (
            <InlineVideo uri={videoUrl} />
          )}
          {license ? <Text style={styles.meta}>Licença: {license}</Text> : null}
          {attribution ? <Text style={styles.meta}>Crédito: {attribution}</Text> : null}
          {!license && !attribution ? <Text style={styles.warning}>Mídia complementar pendente de revisão de licença.</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.navy, borderRadius: 24, padding: 14, marginVertical: 12 },
  title: { color: theme.colors.white, fontSize: 17, fontWeight: '900', marginBottom: 10 },
  guide: { backgroundColor: '#102A4D', borderRadius: 18, padding: 14 },
  guideTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  guideEyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  guideTitle: { color: theme.colors.white, fontSize: 13, fontWeight: '900', marginTop: 3 },
  playButton: { backgroundColor: theme.colors.lime, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  playButtonText: { color: theme.colors.navyDark, fontSize: 9, fontWeight: '900' },
  stage: { flexDirection: 'row', alignItems: 'center', minHeight: 158, marginTop: 12, backgroundColor: '#071B34', borderRadius: 16, padding: 14, gap: 14 },
  poseHalo: { width: 94, height: 118, borderRadius: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#173A63' },
  pose: { fontSize: 58 },
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
  referenceWrap: { marginTop: 12 },
  referenceTitle: { color: '#C8D4E3', fontSize: 10, fontWeight: '900', marginBottom: 7 },
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#07182C', borderRadius: 12 },
  meta: { color: '#C8D4E3', fontSize: 9, lineHeight: 14, marginTop: 5 },
  warning: { color: '#FFD5D5', fontSize: 9, lineHeight: 14, marginTop: 7 },
});

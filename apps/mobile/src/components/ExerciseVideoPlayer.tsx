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

type DetailTab = 'technique' | 'beginner' | 'errors';

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

function GuidedMotion({ title, showAvatar }: { title: string; showAvatar: boolean }) {
  const guidance = useMemo(() => getExerciseGuidance(title), [title]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('technique');
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;
  const phase = guidance.phases[phaseIndex] ?? guidance.phases[0] ?? {
    title: 'Posição inicial',
    cue: 'Posicione-se com estabilidade e execute o movimento de forma controlada.',
    breathing: 'Respire naturalmente e evite prender a respiração.',
  };

  useEffect(() => {
    if (!playing || guidance.phases.length < 2) return;
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

  const detailText = detailTab === 'beginner'
    ? guidance.beginnerTip
    : detailTab === 'errors'
      ? guidance.commonErrors
      : `${phase.cue} Respiração: ${phase.breathing}`;

  return (
    <View style={styles.guide}>
      <View style={styles.guideTopRow}>
        <View style={styles.guideHeading}>
          <Text style={styles.guideEyebrow}>TÉCNICA GUIADA · 4 FASES</Text>
          <Text style={styles.guideTitle}>Acompanhe posição, movimento, controle e retorno</Text>
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

      <View style={[styles.stage, !showAvatar && styles.stageTextOnly]}>
        {showAvatar ? <ExerciseMotionAvatar pose={guidance.pose} slow={slow} playing={playing} /> : null}
        <Animated.View style={[styles.phaseTextWrap, { opacity, transform: [{ translateY: translate }] }]}>
          <Text style={styles.phaseCounter}>FASE {Math.min(phaseIndex + 1, 4)} DE 4</Text>
          <Text style={styles.phaseTitle}>{phase.title}</Text>
          <Text style={styles.phaseCue}>{phase.cue}</Text>
          <Text style={styles.breathing}>Respiração: {phase.breathing}</Text>
        </Animated.View>
      </View>

      <View style={styles.phaseDots}>
        {guidance.phases.slice(0, 4).map((item, index) => (
          <TouchableOpacity
            key={`${item.title}-${index}`}
            onPress={() => goTo(index)}
            style={[styles.phaseDot, index === phaseIndex && styles.phaseDotActive]}
          >
            <Text style={[styles.phaseDotText, index === phaseIndex && styles.phaseDotTextActive]}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.detailTabs}>
        <TouchableOpacity onPress={() => setDetailTab('technique')} style={[styles.detailTab, detailTab === 'technique' && styles.detailTabActive]}>
          <Text style={[styles.detailTabText, detailTab === 'technique' && styles.detailTabTextActive]}>Técnica</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDetailTab('beginner')} style={[styles.detailTab, detailTab === 'beginner' && styles.detailTabActive]}>
          <Text style={[styles.detailTabText, detailTab === 'beginner' && styles.detailTabTextActive]}>Iniciante</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDetailTab('errors')} style={[styles.detailTab, detailTab === 'errors' && styles.detailTabActive]}>
          <Text style={[styles.detailTabText, detailTab === 'errors' && styles.detailTabTextActive]}>Erros</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.detailCard, detailTab === 'errors' && styles.detailCardWarning]}>
        <Text style={styles.detailCardTitle}>
          {detailTab === 'technique' ? 'Como executar esta fase' : detailTab === 'beginner' ? 'Para quem está começando' : 'Erros que devem ser evitados'}
        </Text>
        <Text style={styles.detailCardText}>{detailText}</Text>
      </View>
    </View>
  );
}

export function ExerciseVideoPlayer({ title, videoUrl, license, attribution }: Props) {
  const media = resolveExerciseMedia(title, videoUrl);
  const hasPlayableMedia = media.kind === 'local-clip' || media.kind === 'remote-video' || media.kind === 'remote-image';
  const localAnimation = media.kind === 'local-clip';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>COMO FAZER</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.statusBadge, localAnimation && styles.statusBadgeAnimation]}>
          <Text style={styles.statusBadgeText}>{localAnimation ? 'ANIMAÇÃO OFFLINE' : hasPlayableMedia ? 'DEMONSTRAÇÃO' : 'GUIA OFFLINE'}</Text>
        </View>
      </View>

      {hasPlayableMedia ? (
        <View style={styles.referenceWrap}>
          <View style={styles.mediaFrame}>
            {media.kind === 'remote-image' ? (
              <Image source={{ uri: media.source }} style={styles.media} resizeMode="contain" />
            ) : media.kind === 'local-clip' || media.kind === 'remote-video' ? (
              <InlineVideo source={media.source} />
            ) : null}
          </View>

          {localAnimation ? (
            <View style={styles.animationNotice}>
              <Text style={styles.animationNoticeTitle}>Demonstração animada para esta homologação</Text>
              <Text style={styles.animationNoticeText}>Este clipe é uma animação contínua própria do Evolua Core. Ele ajuda a visualizar o movimento, mas ainda não é o vídeo realista final no padrão definido para o produto.</Text>
            </View>
          ) : null}

          {license ? <Text style={styles.meta}>Licença: {license}</Text> : null}
          {attribution ? <Text style={styles.meta}>Crédito: {attribution}</Text> : null}
          {media.kind !== 'local-clip' && !license && !attribution ? <Text style={styles.warning}>Mídia complementar pendente de revisão de licença.</Text> : null}
        </View>
      ) : (
        <View style={styles.clipPendingCard}>
          <Text style={styles.clipPendingTitle}>Demonstração em vídeo ainda pendente</Text>
          <Text style={styles.clipPendingText}>O guia abaixo continua disponível offline com fases, respiração, dica para iniciante e erros comuns.</Text>
        </View>
      )}

      <GuidedMotion title={title} showAvatar={!hasPlayableMedia} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.navy, borderRadius: 26, padding: 14, marginVertical: 12, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  headerCopy: { flex: 1 },
  headerEyebrow: { color: theme.colors.lime, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 3 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#21466F' },
  statusBadgeAnimation: { backgroundColor: '#5B4C1F' },
  statusBadgeText: { color: theme.colors.white, fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
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
  stageTextOnly: { minHeight: 132 },
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
  detailTabs: { flexDirection: 'row', gap: 7, marginTop: 13 },
  detailTab: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: '#486482', paddingVertical: 8, alignItems: 'center' },
  detailTabActive: { backgroundColor: theme.colors.lime, borderColor: theme.colors.lime },
  detailTabText: { color: '#C8D4E3', fontSize: 9, fontWeight: '900' },
  detailTabTextActive: { color: theme.colors.navyDark },
  detailCard: { backgroundColor: '#203E63', borderRadius: 13, padding: 12, marginTop: 9 },
  detailCardWarning: { backgroundColor: '#402B35' },
  detailCardTitle: { color: theme.colors.lime, fontSize: 10, fontWeight: '900' },
  detailCardText: { color: '#E4ECF5', fontSize: 10, lineHeight: 16, marginTop: 4 },
  referenceWrap: { marginBottom: 12 },
  mediaFrame: { borderRadius: 18, overflow: 'hidden', backgroundColor: '#07182C', borderWidth: 1, borderColor: '#2C4B70' },
  media: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#07182C' },
  animationNotice: { backgroundColor: '#3C331B', borderRadius: 13, padding: 11, marginTop: 9 },
  animationNoticeTitle: { color: '#FFE19A', fontSize: 9, fontWeight: '900' },
  animationNoticeText: { color: '#F2E7C8', fontSize: 9, lineHeight: 14, marginTop: 4 },
  meta: { color: '#AFC0D4', fontSize: 8, lineHeight: 13, marginTop: 4 },
  warning: { color: '#FFD5D5', fontSize: 9, lineHeight: 14, marginTop: 7 },
  clipPendingCard: { backgroundColor: '#183B62', borderRadius: 14, padding: 12, marginBottom: 12 },
  clipPendingTitle: { color: theme.colors.lime, fontSize: 10, fontWeight: '900' },
  clipPendingText: { color: '#D2DEEB', fontSize: 9, lineHeight: 14, marginTop: 4 },
});
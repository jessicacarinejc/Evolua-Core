import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import { theme } from '../theme';

const tracks = [
  {
    title: 'After Party',
    artist: 'Loyalty Freak Music',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/Music_for_Video/Loyalty_Freak_Music/ROBOT_DANCE_/Loyalty_Freak_Music_-_03_-_After_Party.mp3',
  },
  {
    title: 'Lucidity',
    artist: 'Soft and Furious',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/Music_for_Video/Soft_and_Furious/Dancing_in_the_closet/Soft_and_Furious_-_03_-_Lucidity.mp3',
  },
  {
    title: 'Dance of the Electronic Fairies',
    artist: 'Monplaisir',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Monplaisir/Sentimental/Monplaisir_-_03_-_Dance_of_the_electronic_fairies.mp3',
  },
] as const;

const fallbackTrack = {
  title: 'Evolua Core Gym Mix',
  artist: 'Playlist de treino',
  url: '',
};

export function WorkoutMusicPlayer() {
  const playlist = useAudioPlaylist({ sources: tracks.map((track) => track.url), loop: 'all' });
  const status = useAudioPlaylistStatus(playlist);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(0.55);
  const current = tracks[status.currentIndex] ?? tracks[0] ?? fallbackTrack;

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    playlist.volume = volume;
  }, [playlist, volume]);

  useEffect(() => {
    if (!enabled || !status.isLoaded || status.playing) return;
    playlist.play();
  }, [enabled, playlist, status.isLoaded, status.playing]);

  useEffect(() => () => {
    playlist.pause();
  }, [playlist]);

  const toggle = () => {
    if (status.playing) {
      playlist.pause();
      setEnabled(false);
      return;
    }
    setEnabled(true);
    playlist.play();
  };

  const changeVolume = (delta: number) => {
    setVolume((currentVolume) => Math.max(0, Math.min(1, Math.round((currentVolume + delta) * 10) / 10)));
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.icon}><Text style={styles.iconText}>♫</Text></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MÚSICA DO TREINO</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.artist}>{current.artist} · ritmo de academia</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => playlist.previous()} style={styles.controlButton}>
          <Text style={styles.controlText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} style={styles.playButton}>
          <Text style={styles.playText}>{status.playing ? 'Pausar' : 'Tocar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => playlist.next()} style={styles.controlButton}>
          <Text style={styles.controlText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.volumeRow}>
        <Text style={styles.volumeLabel}>Volume {Math.round(volume * 100)}%</Text>
        <View style={styles.volumeActions}>
          <TouchableOpacity onPress={() => changeVolume(-0.1)} style={styles.volumeButton}><Text style={styles.volumeText}>−</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => changeVolume(0.1)} style={styles.volumeButton}><Text style={styles.volumeText}>+</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={styles.license}>Playlist inicial com faixas CC0 para homologação. A reprodução requer conexão para carregar as faixas nesta versão.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0B2440', borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#284969' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: theme.colors.navyDark, fontSize: 22, fontWeight: '900' },
  headingCopy: { flex: 1 },
  eyebrow: { color: theme.colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.white, fontSize: 15, fontWeight: '900', marginTop: 2 },
  artist: { color: '#B8C7D9', fontSize: 10, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  controlButton: { width: 44, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#56718D', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: theme.colors.white, fontSize: 26, lineHeight: 28, fontWeight: '800' },
  playButton: { flex: 1, height: 42, borderRadius: 12, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' },
  playText: { color: theme.colors.navyDark, fontWeight: '900', fontSize: 12 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  volumeLabel: { color: '#C8D4E3', fontSize: 10, fontWeight: '700' },
  volumeActions: { flexDirection: 'row', gap: 6 },
  volumeButton: { width: 34, height: 30, borderRadius: 10, backgroundColor: '#183B60', alignItems: 'center', justifyContent: 'center' },
  volumeText: { color: theme.colors.white, fontSize: 18, fontWeight: '900' },
  license: { color: '#7890A9', fontSize: 8, lineHeight: 12, marginTop: 10 },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import { getApiBaseUrl } from '../api/runtime-config';
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

const styleLabels: Record<string, string> = {
  gym_mix: 'Gym Mix',
  eletronica: 'Eletrônica',
  pop_treino: 'Pop treino',
  hip_hop: 'Hip-hop',
  rock: 'Rock',
  sem_preferencia: 'Variado',
};

type Props = {
  token: string;
};

export function WorkoutMusicPlayer({ token }: Props) {
  const playlist = useAudioPlaylist({ sources: tracks.map((track) => track.url), loop: 'all' });
  const status = useAudioPlaylistStatus(playlist);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [style, setStyle] = useState('gym_mix');
  const current = tracks[status.currentIndex] ?? tracks[0] ?? fallbackTrack;

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const apiUrl = await getApiBaseUrl();
        const response = await fetch(`${apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => null);
        if (!active) return;
        if (response.ok) {
          const profile = payload?.profile ?? {};
          setEnabled(profile.musicEnabled !== false);
          setVolume(Math.max(0, Math.min(1, Number(profile.musicVolume ?? 55) / 100)));
          setStyle(String(profile.musicStyle ?? 'gym_mix'));
        } else {
          setEnabled(true);
        }
      } catch {
        if (active) setEnabled(true);
      } finally {
        if (active) setPreferencesLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    playlist.volume = volume;
  }, [playlist, volume]);

  useEffect(() => {
    if (!preferencesLoaded || !enabled || !status.isLoaded || status.playing) return;
    playlist.play();
  }, [enabled, playlist, preferencesLoaded, status.isLoaded, status.playing]);

  useEffect(() => {
    if (!enabled && status.playing) playlist.pause();
  }, [enabled, playlist, status.playing]);

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

  if (!preferencesLoaded) {
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>MÚSICA DO TREINO</Text>
        <Text style={styles.loadingText}>Preparando suas preferências de áudio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.icon}><Text style={styles.iconText}>♫</Text></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MÚSICA DO TREINO · {styleLabels[style] ?? 'Gym Mix'}</Text>
          <Text style={styles.title}>{enabled ? current.title : 'Música desativada'}</Text>
          <Text style={styles.artist}>{enabled ? `${current.artist} · ritmo de academia` : 'Toque em “Tocar” se quiser música nesta sessão.'}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity disabled={!enabled} onPress={() => playlist.previous()} style={[styles.controlButton, !enabled && styles.controlDisabled]}>
          <Text style={styles.controlText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggle} style={styles.playButton}>
          <Text style={styles.playText}>{status.playing ? 'Pausar' : 'Tocar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!enabled} onPress={() => playlist.next()} style={[styles.controlButton, !enabled && styles.controlDisabled]}>
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

      <Text style={styles.license}>Playlist inicial de homologação. A reprodução requer conexão para carregar as faixas nesta versão.</Text>
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
  loadingText: { color: '#C8D4E3', fontSize: 11, marginTop: 5 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  controlButton: { width: 44, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#56718D', alignItems: 'center', justifyContent: 'center' },
  controlDisabled: { opacity: 0.35 },
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

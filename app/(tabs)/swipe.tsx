import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { api } from '@/lib/api';
import { useMatches } from '@/lib/matches-context';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
};

const SWIPE_THRESHOLD = 120;

export default function SwipeScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const { refreshMatchesCount } = useMatches();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/feed');
      setJobs(data);
      setIndex(0);
    } catch {
      Alert.alert('Could not load jobs', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  async function recordSwipe(jobId: string, decision: 'accepted' | 'rejected') {
    try {
      await api.post('/jobs/swipe', { jobId, decision });
      if (decision === 'accepted') refreshMatchesCount();
    } catch {
      // Fail silently for the demo — the card has already moved on visually,
      // and retrying a swipe is confusing UX. Worth revisiting with a retry
      // queue if this becomes a real reliability issue.
    }
  }

  function goToNextCard(decision: 'accepted' | 'rejected') {
    const current = jobs[index];
    if (current) recordSwipe(current.id, decision);
    translateX.value = 0;
    translateY.value = 0;
    rotate.value = 0;
    setIndex((i) => i + 1);
  }

  function decideSwipe(direction: 'left' | 'right') {
    const toX = direction === 'right' ? 500 : -500;
    translateX.value = withTiming(toX, { duration: 250 }, () => {
      runOnJS(goToNextCard)(direction === 'right' ? 'accepted' : 'rejected');
    });
  }

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      rotate.value = e.translationX / 20;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(decideSwipe)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(decideSwipe)('left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2F7864" size="large" />
      </View>
    );
  }

  const current = jobs[index];
  const next = jobs[index + 1];

  if (!current) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>You're all caught up</Text>
        <Text style={styles.emptySubtitle}>No more jobs right now — check back later.</Text>
        <Pressable style={styles.refreshButton} onPress={loadFeed}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Swipe</Text>

      <View style={styles.deck}>
        {next && (
          <View style={[styles.card, styles.cardBehind]}>
            <Text style={styles.jobTitle}>{next.title}</Text>
            <Text style={styles.jobMeta}>{next.company} · {next.location}</Text>
          </View>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            <Text style={styles.jobTitle}>{current.title}</Text>
            <Text style={styles.jobMeta}>{current.company} · {current.location}</Text>
            <Text style={styles.jobDescription} numberOfLines={6}>
              {current.description}
            </Text>
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.rejectButton]} onPress={() => decideSwipe('left')}>
          <Text style={styles.rejectButtonText}>✕</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.acceptButton]} onPress={() => decideSwipe('right')}>
          <Text style={styles.acceptButtonText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 420;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  centered: { flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { fontSize: 22, fontWeight: '600', color: '#1F2A37', padding: 20, paddingBottom: 8 },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#E5E2DA',
  },
  cardBehind: { transform: [{ scale: 0.96 }], opacity: 0.6 },
  jobTitle: { fontSize: 20, fontWeight: '700', color: '#1F2A37', marginBottom: 6 },
  jobMeta: { fontSize: 13, color: '#5C6570', marginBottom: 16 },
  jobDescription: { fontSize: 14, color: '#1F2A37', lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingBottom: 32 },
  actionButton: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  rejectButton: { borderColor: '#B5602F' },
  rejectButtonText: { color: '#B5602F', fontSize: 24, fontWeight: '700' },
  acceptButton: { borderColor: '#2F7864' },
  acceptButtonText: { color: '#2F7864', fontSize: 24, fontWeight: '700' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2A37', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#5C6570', textAlign: 'center', marginBottom: 20 },
  refreshButton: { backgroundColor: '#2F7864', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  refreshButtonText: { color: '#FAF9F6', fontSize: 15, fontWeight: '600' },
});
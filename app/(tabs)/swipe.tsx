import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { api } from '@/lib/api';
import { useMatches } from '@/lib/matches-context';
import { FONTS } from '@/constants/fonts';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  skillTags?: string[];
  redirectUrl?: string;
};

const SWIPE_THRESHOLD = 120;
const THROW_DISTANCE = 600;
const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const TERRACOTTA = '#B5602F';
const GRAY = '#5C6570';
const BG = '#FAF9F6';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  const fmt = (n?: number) => (n ? `£${Math.round(n / 1000)}k` : '');
  if (job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax) {
    return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
  }
  return fmt(job.salaryMin ?? job.salaryMax);
}

function BackgroundCard({ scale, opacity, job }: { scale: number; opacity: number; job?: Job }) {
  if (!job) return null;
  return (
    <View style={[styles.card, { transform: [{ scale }], opacity }]} pointerEvents="none">
      <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
    </View>
  );
}

function SwipeCard({
  job,
  onSwiped,
  onApply,
  onOpenDetail,
  isTop,
}: {
  job: Job;
  onSwiped: (decision: 'accepted' | 'rejected') => void;
  onApply: (job: Job) => void;
  onOpenDetail: (jobId: string) => void;
  isTop: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  function completeSwipe(decision: 'accepted' | 'rejected') {
    onSwiped(decision);
  }

  function throwCard(direction: 'left' | 'right') {
    const toX = direction === 'right' ? THROW_DISTANCE : -THROW_DISTANCE;
    translateX.value = withTiming(toX, { duration: 250 }, (finished) => {
      if (finished) runOnJS(completeSwipe)(direction === 'right' ? 'accepted' : 'rejected');
    });
  }

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(throwCard)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(throwCard)('left');
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(isTop)
    .maxDistance(10)
    .onEnd(() => {
      runOnJS(onOpenDetail)(job.id);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-300, 0, 300], [-18, 0, 18], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 100], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-100, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const salary = formatSalary(job);
  const isRemote = /remote/i.test(job.location);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.badge, styles.likeBadge, likeStyle]}>
          <Text style={[styles.badgeText, { color: TEAL }]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.nopeBadge, nopeStyle]}>
          <Text style={[styles.badgeText, { color: TERRACOTTA }]}>NOPE</Text>
        </Animated.View>

        <View style={styles.cardTop}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{job.location}</Text>
            {isRemote && <Text style={[styles.metaChip, styles.metaChipTeal]}>Remote</Text>}
            {salary && <Text style={[styles.metaChip, styles.metaChipTeal]}>{salary}</Text>}
          </View>

          {!!job.skillTags?.length && (
            <View style={styles.tagsRow}>
              {job.skillTags.slice(0, 4).map((tag) => (
                <Text key={tag} style={styles.tag}>{tag}</Text>
              ))}
            </View>
          )}

          <Text style={styles.jobDescription} numberOfLines={6}>
            {job.description}
          </Text>
          <Text style={styles.readMore}>Tap card for full details</Text>
        </View>

        <Pressable style={styles.applyButton} onPress={() => onApply(job)}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

export default function SwipeScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const { refreshMatchesCount } = useMatches();
  const insets = useSafeAreaInsets();

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
      // Fail silently — card has already moved on visually.
    }
  }

  function handleSwiped(decision: 'accepted' | 'rejected') {
    const current = jobs[index];
    if (current) recordSwipe(current.id, decision);
    setIndex((i) => i + 1);
  }

  async function handleApply(job: Job) {
    if (!job.redirectUrl) {
      Alert.alert('No external link', 'This job has no application link on file.');
      return;
    }
    try {
      await Linking.openURL(job.redirectUrl);
    } catch {
      Alert.alert('Could not open', 'Unable to open this link. Please try again.');
    }
  }

  function handleOpenDetail(jobId: string) {
    router.push(`/job/${jobId}`);
  }

  function manualSwipe(direction: 'left' | 'right') {
    handleSwiped(direction === 'right' ? 'accepted' : 'rejected');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TEAL} size="large" />
      </View>
    );
  }

  const current = jobs[index];
  const next = jobs[index + 1];
  const nextNext = jobs[index + 2];

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
      <Text style={[styles.header, { paddingTop: insets.top + 12 }]}>Swipe</Text>

      <View style={styles.deck}>
        <BackgroundCard job={nextNext} scale={0.92} opacity={0.4} />
        <BackgroundCard job={next} scale={0.96} opacity={0.7} />
        <SwipeCard
          key={current.id}
          job={current}
          onSwiped={handleSwiped}
          onApply={handleApply}
          onOpenDetail={handleOpenDetail}
          isTop
        />
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={[styles.actionButton, styles.rejectButton]} onPress={() => manualSwipe('left')}>
          <Text style={styles.rejectButtonText}>✕</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.acceptButton]} onPress={() => manualSwipe('right')}>
          <Text style={styles.acceptButtonText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_WIDTH = SCREEN_W - 32;
const CARD_HEIGHT = SCREEN_H * 0.58;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { fontFamily: FONTS.bold, fontSize: 22, color: NAVY, paddingHorizontal: 20, paddingBottom: 4 },
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#E5E2DA',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    justifyContent: 'space-between',
  },
  cardTop: { flex: 1 },
  jobTitle: { fontFamily: FONTS.bold, fontSize: 22, color: NAVY, marginBottom: 2 },
  jobCompany: { fontFamily: FONTS.regular, fontSize: 14, color: GRAY, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaChip: {
    fontFamily: FONTS.semibold, fontSize: 11, color: GRAY, backgroundColor: '#F0EEE9',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden',
  },
  metaChipTeal: { color: TEAL, backgroundColor: '#E4EFEC' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    fontFamily: FONTS.semibold, fontSize: 11, color: NAVY, borderWidth: 1, borderColor: '#E5E2DA',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  jobDescription: { fontFamily: FONTS.regular, fontSize: 13.5, color: NAVY, lineHeight: 19 },
  readMore: { fontFamily: FONTS.semibold, fontSize: 11, color: TEAL, marginTop: 8 },
  applyButton: {
    backgroundColor: NAVY, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12,
  },
  applyButtonText: { fontFamily: FONTS.semibold, color: BG, fontSize: 14 },
  badge: {
    position: 'absolute', top: 24, zIndex: 10,
    borderWidth: 3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    transform: [{ rotate: '-12deg' }],
  },
  likeBadge: { left: 20, borderColor: TEAL },
  nopeBadge: { right: 20, borderColor: TERRACOTTA, transform: [{ rotate: '12deg' }] },
  badgeText: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 1 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingTop: 8 },
  actionButton: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  rejectButton: { borderColor: TERRACOTTA },
  rejectButtonText: { color: TERRACOTTA, fontSize: 24, fontWeight: '700' },
  acceptButton: { borderColor: TEAL },
  acceptButtonText: { color: TEAL, fontSize: 24, fontWeight: '700' },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18, color: NAVY, marginBottom: 6 },
  emptySubtitle: { fontFamily: FONTS.regular, fontSize: 14, color: GRAY, textAlign: 'center', marginBottom: 20 },
  refreshButton: { backgroundColor: TEAL, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  refreshButtonText: { fontFamily: FONTS.semibold, color: BG, fontSize: 15 },
});
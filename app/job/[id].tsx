import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { useMatches } from '@/lib/matches-context';
import { FONTS } from '@/constants/fonts';

const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const TERRACOTTA = '#B5602F';
const GRAY = '#5C6570';
const BG = '#FAF9F6';

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

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  const fmt = (n?: number) => (n ? `£${Math.round(n / 1000)}k` : '');
  if (job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax) {
    return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
  }
  return fmt(job.salaryMin ?? job.salaryMax);
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshMatchesCount } = useMatches();

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data);
    } catch {
      Alert.alert('Could not load job', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(decision: 'accepted' | 'rejected') {
    if (!job) return;
    try {
      await api.post('/jobs/swipe', { jobId: job.id, decision });
      if (decision === 'accepted') refreshMatchesCount();
      router.back();
    } catch {
      Alert.alert('Could not record your decision', 'Please try again.');
    }
  }

  async function handleApply() {
    if (!job?.redirectUrl) {
      Alert.alert('No external link', 'This job has no application link on file.');
      return;
    }
    try {
      await Linking.openURL(job.redirectUrl);
    } catch {
      Alert.alert('Could not open', 'Unable to open this link.');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TEAL} size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Job not found.</Text>
      </View>
    );
  }

  const salary = formatSalary(job);
  const isRemote = /remote/i.test(job.location);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.company}>{job.company}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>{job.location}</Text>
          {isRemote && <Text style={[styles.metaChip, styles.metaChipTeal]}>Remote</Text>}
          {salary && <Text style={[styles.metaChip, styles.metaChipTeal]}>{salary}</Text>}
        </View>

        {!!job.skillTags?.length && (
          <View style={styles.tagsRow}>
            {job.skillTags.map((tag) => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>About the Role</Text>
        <Text style={styles.description}>{job.description}</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[styles.decisionButton, styles.rejectButton]} onPress={() => handleDecision('rejected')}>
          <Text style={[styles.decisionButtonText, { color: TERRACOTTA }]}>✕ Pass</Text>
        </Pressable>
        <Pressable style={[styles.decisionButton, styles.acceptButton]} onPress={() => handleDecision('accepted')}>
          <Text style={[styles.decisionButtonText, { color: TEAL }]}>✓ Accept</Text>
        </Pressable>
        <Pressable style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: FONTS.regular, color: GRAY, fontSize: 14 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  backArrow: { fontSize: 22, color: NAVY },
  title: { fontFamily: FONTS.bold, fontSize: 24, color: NAVY, marginBottom: 4 },
  company: { fontFamily: FONTS.regular, fontSize: 15, color: GRAY, marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  metaChip: {
    fontFamily: FONTS.semibold, fontSize: 11, color: GRAY, backgroundColor: '#F0EEE9',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: 'hidden',
  },
  metaChipTeal: { color: TEAL, backgroundColor: '#E4EFEC' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  tag: {
    fontFamily: FONTS.semibold, fontSize: 11, color: NAVY, borderWidth: 1, borderColor: '#E5E2DA',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  sectionLabel: { fontFamily: FONTS.semibold, fontSize: 13, color: NAVY, marginBottom: 8 },
  description: { fontFamily: FONTS.regular, fontSize: 14.5, color: NAVY, lineHeight: 22 },
  bottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: BG, borderTopWidth: 1, borderTopColor: '#E5E2DA',
  },
  decisionButton: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  rejectButton: { borderColor: TERRACOTTA },
  acceptButton: { borderColor: TEAL },
  decisionButtonText: { fontFamily: FONTS.semibold, fontSize: 14 },
  applyButton: { flex: 1.3, backgroundColor: NAVY, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  applyButtonText: { fontFamily: FONTS.semibold, color: BG, fontSize: 14 },
});
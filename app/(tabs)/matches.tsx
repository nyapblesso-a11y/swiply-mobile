import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { api } from '@/lib/api';
import { useMatches } from '@/lib/matches-context';

type MatchItem = {
  id: string; // swipe id
  createdAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { setMatchesCount } = useMatches();

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs/matches');
      setMatches(data);
      setMatchesCount(data.length);
    } catch {
      Alert.alert('Could not load matches', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setMatchesCount]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeMatch(id: string) {
    const previous = matches;
    setMatches((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setMatchesCount(next.length);
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      await api.delete(`/jobs/matches/${id}`);
    } catch {
      setMatches(previous); // roll back on failure
      setMatchesCount(previous.length);
      Alert.alert('Could not remove match', 'Please try again.');
    }
  }

  async function handleGenerate() {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      await api.post('/documents/generate', { swipeIds: Array.from(selected) });
      Alert.alert('Started', 'Generating your tailored documents.');
      setSelected(new Set());
      router.push('/(tabs)/history');
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert('Coming soon', 'Document generation isn\'t wired up yet.');
      } else {
        Alert.alert('Generation failed', err.response?.data?.message ?? 'Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2F7864" size="large" />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptySubtitle}>Start swiping to find jobs.</Text>
        <Pressable style={styles.emptyCta} onPress={() => router.push('/(tabs)/swipe')}>
          <Text style={styles.emptyCtaText}>Go to Swipe</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Matches</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: selected.size > 0 ? 100 : 24 }}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <View style={styles.row}>
              <Pressable style={styles.checkbox} onPress={() => toggleSelect(item.id)}>
                <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxChecked]}>
                  {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
              </Pressable>

              <Pressable style={styles.rowContent} onPress={() => toggleSelect(item.id)}>
                <Text style={styles.jobTitle}>{item.job.title}</Text>
                <Text style={styles.jobMeta}>
                  {item.job.company} · Accepted{' '}
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </Pressable>

              <Pressable style={styles.removeButton} onPress={() => removeMatch(item.id)}>
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            </View>
          );
        }}
      />

      {selected.size > 0 && (
        <View style={styles.floatingBar}>
          <Text style={styles.selectedCount}>{selected.size} selected</Text>
          <Pressable
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#FAF9F6" />
            ) : (
              <Text style={styles.generateButtonText}>Generate {selected.size} Selected</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  centered: { flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { fontSize: 22, fontWeight: '600', color: '#1F2A37', padding: 20, paddingBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2A37', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#5C6570', marginBottom: 20 },
  emptyCta: { backgroundColor: '#2F7864', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  emptyCtaText: { color: '#FAF9F6', fontSize: 15, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E5E2DA',
  },
  checkbox: { marginRight: 12 },
  checkboxBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#B9C4C0',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxBoxChecked: { backgroundColor: '#2F7864', borderColor: '#2F7864' },
  checkboxCheck: { color: '#FAF9F6', fontSize: 13, fontWeight: '700' },
  rowContent: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#1F2A37' },
  jobMeta: { fontSize: 12, color: '#5C6570', marginTop: 3 },
  removeButton: { paddingHorizontal: 8, paddingVertical: 4 },
  removeButtonText: { color: '#B5602F', fontSize: 16, fontWeight: '600' },
  floatingBar: {
    position: 'absolute', left: 16, right: 16, bottom: 20,
    backgroundColor: '#1F2A37', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectedCount: { color: '#FAF9F6', fontSize: 13, fontWeight: '600', marginRight: 12 },
  generateButton: { flex: 1, backgroundColor: '#2F7864', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  generateButtonDisabled: { opacity: 0.7 },
  generateButtonText: { color: '#FAF9F6', fontSize: 14, fontWeight: '600' },
});
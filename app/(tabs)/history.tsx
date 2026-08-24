import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { api } from '@/lib/api';

const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const GRAY = '#5C6570';
const BG = '#FAF9F6';

type HistoryItem = {
  id: string; // swipe id
  createdAt: string;
  job: { title: string; company: string };
  generatedDocuments: { type: string; createdAt: string }[];
};

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents/history');
      setItems(data);
    } catch {
      Alert.alert('Could not load history', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TEAL} size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No applications yet</Text>
        <Text style={styles.emptySubtitle}>
          Generate a CV and cover letter from your Matches to see them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>History</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const latestGenerated = item.generatedDocuments
            .map((d) => new Date(d.createdAt).getTime())
            .sort((a, b) => b - a)[0];

          return (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/document/${item.id}/preview`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.job.title}</Text>
                <Text style={styles.jobMeta}>
                  {item.job.company} · Generated{' '}
                  {latestGenerated ? new Date(latestGenerated).toLocaleDateString() : '—'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { fontSize: 22, fontWeight: '600', color: NAVY, padding: 20, paddingBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: NAVY, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: GRAY, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E5E2DA',
  },
  jobTitle: { fontSize: 15, fontWeight: '600', color: NAVY },
  jobMeta: { fontSize: 12, color: GRAY, marginTop: 3 },
  chevron: { fontSize: 22, color: GRAY },
});
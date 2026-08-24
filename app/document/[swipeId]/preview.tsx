import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api } from '@/lib/api';

const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const GRAY = '#5C6570';
const BG = '#FAF9F6';

type DocEntry = { id: string; type: 'cv' | 'cover_letter'; fileUrl: string; createdAt: string };
type SwipeDetail = {
  id: string;
  job: { title: string; company: string };
  generatedDocuments: DocEntry[];
};

export default function DocumentPreviewScreen() {
  const { swipeId } = useLocalSearchParams<{ swipeId: string }>();
  const [data, setData] = useState<SwipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'cv' | 'cover_letter'>('cv');

  useEffect(() => {
    load();
  }, [swipeId]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/documents/${swipeId}`);
      setData(data);
    } catch {
      Alert.alert('Could not load documents', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function latestDoc(type: 'cv' | 'cover_letter') {
    const matches = data?.generatedDocuments.filter((d) => d.type === type) ?? [];
    return matches.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  async function openDoc(doc?: DocEntry) {
    if (!doc) {
      Alert.alert('Not available', 'This document has not been generated yet.');
      return;
    }
    try {
      await Linking.openURL(doc.fileUrl);
    } catch {
      Alert.alert('Could not open', 'Unable to open this document. Please try again.');
    }
  }

  async function downloadDoc(doc?: DocEntry, label?: string) {
    if (!doc) {
      Alert.alert('Not available', 'This document has not been generated yet.');
      return;
    }
    setDownloading(true);
    try {
      const filename = `${label ?? 'document'}.pdf`;
      const localUri = FileSystem.documentDirectory + filename;
      const { uri } = await FileSystem.downloadAsync(doc.fileUrl, localUri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename });
      } else {
        Alert.alert('Downloaded', `Saved to app storage as ${filename}`);
      }
    } catch {
      Alert.alert('Download failed', 'Could not download this document. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={TEAL} size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Document not found.</Text>
      </View>
    );
  }

  const activeDoc = latestDoc(activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Your Application</Text>
          <Text style={styles.headerSubtitle}>
            {data.job.title} · {data.job.company}
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'cv' && styles.tabActive]}
          onPress={() => setActiveTab('cv')}
        >
          <Text style={[styles.tabText, activeTab === 'cv' && styles.tabTextActive]}>CV</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'cover_letter' && styles.tabActive]}
          onPress={() => setActiveTab('cover_letter')}
        >
          <Text style={[styles.tabText, activeTab === 'cover_letter' && styles.tabTextActive]}>
            Cover Letter
          </Text>
        </Pressable>
      </View>

      <View style={styles.documentArea}>
        <Text style={styles.documentIcon}>📄</Text>
        <Text style={styles.documentLabel}>
          {activeTab === 'cv' ? 'Tailored CV' : 'Tailored Cover Letter'}
        </Text>
        <Text style={styles.documentSubtext}>
          {activeDoc
            ? `Generated ${new Date(activeDoc.createdAt).toLocaleDateString()}`
            : 'Not yet generated'}
        </Text>

        <Pressable style={styles.viewButton} onPress={() => openDoc(activeDoc)}>
          <Text style={styles.viewButtonText}>View PDF</Text>
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          disabled={downloading}
          onPress={() => downloadDoc(activeDoc, activeTab === 'cv' ? 'CV' : 'Cover_Letter')}
        >
          {downloading ? (
            <ActivityIndicator color={BG} />
          ) : (
            <Text style={styles.downloadButtonText}>Download PDF</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: GRAY, fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  backArrow: { fontSize: 22, color: NAVY },
  headerTitle: { fontSize: 17, fontWeight: '600', color: NAVY },
  headerSubtitle: { fontSize: 12, color: GRAY, marginTop: 2 },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F0EEE9',
    borderRadius: 10, padding: 4, marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: GRAY },
  tabTextActive: { color: TEAL },
  documentArea: {
    flex: 1, marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E2DA', alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 6,
  },
  documentIcon: { fontSize: 40, marginBottom: 8 },
  documentLabel: { fontSize: 16, fontWeight: '600', color: NAVY },
  documentSubtext: { fontSize: 12, color: GRAY, marginBottom: 20 },
  viewButton: {
    borderWidth: 1.5, borderColor: TEAL, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  viewButtonText: { color: TEAL, fontSize: 14, fontWeight: '600' },
  bottomBar: { padding: 20 },
  downloadButton: { backgroundColor: TEAL, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  downloadButtonDisabled: { opacity: 0.7 },
  downloadButtonText: { color: BG, fontSize: 15, fontWeight: '700' },
});
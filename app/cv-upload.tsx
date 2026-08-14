import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type UploadState = 'idle' | 'picked' | 'uploading' | 'success';

export default function CvUploadScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isUpdateMode = mode === 'update';
  const { refreshHasCv } = useAuth();

  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [skillCount, setSkillCount] = useState<number>(0);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    setFileName(file.name);
    setState('picked');
    await uploadFile(file);
  }

  async function uploadFile(file: DocumentPicker.DocumentPickerAsset) {
    setState('uploading');
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/pdf',
      } as any);

      const { data } = await api.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSkillCount(data.parsedSkills?.length ?? 0);
      setState('success');
      await refreshHasCv();
    } catch (err: any) {
      Alert.alert(
        'Upload failed',
        err.response?.data?.message ?? 'Something went wrong. Please try again.',
      );
      setState('idle');
    }
  }

  function handleContinue() {
    if (isUpdateMode) {
      router.back();
    } else {
      router.replace('/(tabs)/swipe');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isUpdateMode ? 'Update Your CV' : 'Get Started'}</Text>
      <Text style={styles.subtitle}>
        {isUpdateMode
          ? 'Upload a new CV to replace your current one.'
          : 'Upload your CV to personalize your job feed and enhance your matching score.'}
      </Text>

      {state === 'idle' && (
        <Pressable style={styles.dropZone} onPress={pickFile}>
          <Text style={styles.dropZoneTitle}>Select a CV file</Text>
          <Text style={styles.dropZoneSubtitle}>Supported types: PDF, DOCX</Text>
        </Pressable>
      )}

      {state === 'uploading' && (
        <View style={styles.dropZone}>
          <ActivityIndicator color="#2F7864" size="large" />
          <Text style={styles.dropZoneSubtitle}>Uploading and analyzing {fileName}…</Text>
        </View>
      )}

      {state === 'success' && (
        <View style={styles.dropZone}>
          <Text style={styles.successCheck}>✓</Text>
          <Text style={styles.dropZoneTitle}>CV parsed!</Text>
          <Text style={styles.dropZoneSubtitle}>
            {skillCount > 0 ? `Found ${skillCount} skills` : 'Ready to continue'}
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.primaryButton, state !== 'success' && styles.primaryButtonDisabled]}
        disabled={state !== 'success'}
        onPress={handleContinue}
      >
        <Text style={styles.primaryButtonText}>
          {isUpdateMode ? 'Done' : 'Continue to Jobs →'}
        </Text>
      </Pressable>

      {isUpdateMode && (
        <Pressable style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '600', color: '#1F2A37', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#5C6570', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  dropZone: {
    borderWidth: 1.5, borderColor: '#E5E2DA', borderStyle: 'dashed', borderRadius: 14,
    paddingVertical: 48, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFFFF',
  },
  dropZoneTitle: { fontSize: 16, fontWeight: '600', color: '#1F2A37' },
  dropZoneSubtitle: { fontSize: 13, color: '#5C6570', marginTop: 4, textAlign: 'center' },
  successCheck: { fontSize: 32, color: '#2F7864', marginBottom: 4 },
  primaryButton: {
    backgroundColor: '#2F7864', borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  primaryButtonDisabled: { backgroundColor: '#B9C4C0' },
  primaryButtonText: { color: '#FAF9F6', fontSize: 16, fontWeight: '600' },
  cancelLink: { alignItems: 'center', marginTop: 16 },
  cancelLinkText: { color: '#5C6570', fontSize: 14 },
});
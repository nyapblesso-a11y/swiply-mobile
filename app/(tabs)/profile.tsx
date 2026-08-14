import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type CvInfo = {
  rawFileUrl: string;
  parsedSkills: string[];
  updatedAt: string;
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [cv, setCv] = useState<CvInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCv = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cv/me');
      setCv(data);
    } catch {
      setCv(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCv();
    }, [loadCv])
  );

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.userCard}>
        <Text style={styles.userName}>{user?.fullName}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.cvCard}>
        <Text style={styles.cvCardTitle}>Your CV</Text>
        {loading ? (
          <ActivityIndicator color="#2F7864" style={{ marginVertical: 12 }} />
        ) : cv ? (
          <>
            <Text style={styles.cvMeta}>
              {cv.parsedSkills?.length ?? 0} skills detected
            </Text>
            <Text style={styles.cvMeta}>
              Last updated {new Date(cv.updatedAt).toLocaleDateString()}
            </Text>
          </>
        ) : (
          <Text style={styles.cvMeta}>No CV on file yet.</Text>
        )}

        <Pressable
          style={styles.updateButton}
          onPress={() => router.push('/cv-upload?mode=update')}
        >
          <Text style={styles.updateButtonText}>{cv ? 'Update CV' : 'Upload CV'}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 20 },
  header: { fontSize: 22, fontWeight: '600', color: '#1F2A37', marginBottom: 20 },
  userCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E2DA',
  },
  userName: { fontSize: 17, fontWeight: '600', color: '#1F2A37' },
  userEmail: { fontSize: 13, color: '#5C6570', marginTop: 4 },
  cvCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E2DA',
  },
  cvCardTitle: { fontSize: 15, fontWeight: '600', color: '#1F2A37', marginBottom: 8 },
  cvMeta: { fontSize: 13, color: '#5C6570', marginBottom: 4 },
  updateButton: {
    backgroundColor: '#2F7864', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginTop: 12,
  },
  updateButtonText: { color: '#FAF9F6', fontSize: 14, fontWeight: '600' },
  logoutButton: {
    borderWidth: 1.5, borderColor: '#B5602F', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 'auto', marginBottom: 20,
  },
  logoutButtonText: { color: '#B5602F', fontSize: 15, fontWeight: '600' },
});
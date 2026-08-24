import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image, Switch, ScrollView } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const GRAY = '#5C6570';
const BG = '#FAF9F6';
const TERRACOTTA = '#B5602F';
const BORDER = '#E5E2DA';

type CvInfo = { rawFileUrl: string; parsedSkills: string[]; updatedAt: string };

function extractFilename(url: string) {
  const parts = url.split('/');
  return parts[parts.length - 1] || 'CV.pdf';
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [cv, setCv] = useState<CvInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);

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
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable hitSlop={12}>
          <Ionicons name="menu" size={24} color={NAVY} />
        </Pressable>
        <Text style={styles.topBarTitle}>Swiply</Text>
        <Pressable hitSlop={12}>
          <Ionicons name="notifications-outline" size={22} color={NAVY} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.cvCard}>
          <View style={styles.cvIconWrap}>
            <Ionicons name="document-text-outline" size={20} color={NAVY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cvLabel}>Current CV</Text>
            {loading ? (
              <ActivityIndicator size="small" color={TEAL} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.cvFilename} numberOfLines={1}>
                {cv ? extractFilename(cv.rawFileUrl) : 'No CV uploaded'}
              </Text>
            )}
          </View>
          <Pressable onPress={() => router.push('/cv-upload?mode=update')}>
            <Text style={styles.updateCvLink}>{cv ? 'Update CV' : 'Upload CV'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT SETTINGS</Text>
        <View style={styles.settingsGroup}>
          <SettingRow icon="person-outline" label="Personal Information" onPress={() => {}} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={18} color={NAVY} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={setNotificationsOn}
              trackColor={{ false: '#D9D5CC', true: TEAL }}
              thumbColor="#FFFFFF"
            />
          </View>
          <SettingRow icon="shield-outline" label="Privacy & Data" onPress={() => {}} />
          <SettingRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} last />
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={TERRACOTTA} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.settingRow, !last && styles.settingRowBorder]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={18} color={NAVY} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={GRAY} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: NAVY },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG,
  },
  userName: { fontSize: 19, fontWeight: '700', color: NAVY },
  userEmail: { fontSize: 13, color: GRAY, marginTop: 2 },
  cvCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    marginHorizontal: 20, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER,
    marginBottom: 24,
  },
  cvIconWrap: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0EEE9',
    alignItems: 'center', justifyContent: 'center',
  },
  cvLabel: { fontSize: 12, color: GRAY },
  cvFilename: { fontSize: 14, fontWeight: '600', color: NAVY, marginTop: 2 },
  updateCvLink: { fontSize: 13, fontWeight: '600', color: TEAL },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: GRAY, letterSpacing: 0.5,
    marginHorizontal: 20, marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 24, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 14, color: NAVY, fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: TERRACOTTA, borderRadius: 12, paddingVertical: 14,
    marginHorizontal: 20,
  },
  logoutText: { color: TERRACOTTA, fontSize: 15, fontWeight: '600' },
});
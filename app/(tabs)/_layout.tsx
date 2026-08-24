import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useMatches } from '@/lib/matches-context';

const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const GRAY = '#5C6570';
const BG = '#FAF9F6';
const TEAL_TINT = '#E4EFEC';
const TERRACOTTA = '#B5602F';

function TabIcon({
  name,
  focused,
  badgeCount,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={name} size={20} color={focused ? TEAL : GRAY} />
      {!!badgeCount && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const { matchesCount } = useMatches();
  const insets = useSafeAreaInsets();

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NAVY,
        tabBarInactiveTintColor: GRAY,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 12,
          height: 64,
          borderRadius: 22,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="swipe"
        options={{ title: 'Swipe', tabBarIcon: ({ focused }) => <TabIcon name="swap-horizontal" focused={focused} /> }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} badgeCount={matchesCount} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ focused }) => <TabIcon name="time" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: { width: 40, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconWrapperActive: { backgroundColor: TEAL_TINT },
  badge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: TERRACOTTA, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
});
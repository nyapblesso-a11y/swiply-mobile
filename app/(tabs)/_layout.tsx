import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowLeftRight, Heart, History as HistoryIcon } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useMatches } from '@/lib/matches-context';

const NAVY = '#1F2A37';
const TEAL = '#2F7864';
const GRAY = '#5C6570';
const BG = '#FAF9F6';
const TEAL_TINT = '#E4EFEC';
const TERRACOTTA = '#B5602F';

function TabIcon({
  Icon,
  focused,
  badgeCount,
}: {
  Icon: typeof ArrowLeftRight;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Icon size={20} color={focused ? TEAL : GRAY} strokeWidth={2} />
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
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: '#E5E2DA',
          height: 78,
          paddingTop: 10,
          paddingBottom: 20,
        },
      }}>
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ focused }) => <TabIcon Icon={ArrowLeftRight} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Heart} focused={focused} badgeCount={matchesCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon Icon={HistoryIcon} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 40,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: TEAL_TINT,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: TERRACOTTA,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BG,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
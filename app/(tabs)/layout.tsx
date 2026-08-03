import { Redirect, Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  if (isLoading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="swipe" options={{ title: 'Swipe', tabBarIcon: () => null }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: () => null }} />
    </Tabs>
  );
}
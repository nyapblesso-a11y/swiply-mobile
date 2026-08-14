import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth-context';

export default function AuthLayout() {
  const { user, isLoading, hasCv } = useAuth();

  if (isLoading || (user && hasCv === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#2F7864" size="large" />
      </View>
    );
  }

  if (user) return <Redirect href={hasCv ? '/(tabs)/swipe' : '/cv-upload'} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
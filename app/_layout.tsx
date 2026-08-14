import { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { Slot } from 'expo-router';
import { SplashOverlay } from '@/components/splash-screen';
import { AuthProvider } from '@/lib/auth-context';
import { MatchesProvider } from '@/lib/matches-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <MatchesProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {showSplash && <SplashOverlay />}
            <Slot />
          </ThemeProvider>
        </MatchesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
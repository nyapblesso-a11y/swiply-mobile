import { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { Slot } from 'expo-router';
import { SplashOverlay } from '@/components/splash-screen';
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {showSplash && <SplashOverlay onFinish={() => setShowSplash(false)} />}
        <Slot />
      </ThemeProvider>
    </AuthProvider>
  );
}
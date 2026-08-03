import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(fullName, email, password);
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Swiply</Text>
      <Text style={styles.subtitle}>Create an account to get started</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#5C6570" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#5C6570" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#5C6570" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#5C6570" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

      <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FAF9F6" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
      </Pressable>

      <View style={styles.socialRow}>
        <Pressable style={styles.socialButton} disabled onPress={() => Alert.alert('Coming soon')}>
          <Text style={styles.socialButtonText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialButton} disabled onPress={() => Alert.alert('Coming soon')}>
          <Text style={styles.socialButtonText}>GitHub</Text>
        </Pressable>
      </View>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? <Text style={styles.linkBold}>Log In</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '600', color: '#1F2A37', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#5C6570', textAlign: 'center', marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: '#E5E2DA', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14,
    fontSize: 15, color: '#1F2A37', backgroundColor: '#FFFFFF',
  },
  primaryButton: { backgroundColor: '#2F7864', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FAF9F6', fontSize: 16, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  socialButton: { flex: 1, borderWidth: 1, borderColor: '#E5E2DA', borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: 0.5 },
  socialButtonText: { color: '#5C6570', fontSize: 14 },
  link: { textAlign: 'center', color: '#5C6570', marginTop: 24, fontSize: 13 },
  linkBold: { color: '#2F7864', fontWeight: '600' },
});
import { View, Text, StyleSheet } from 'react-native';

export default function SwipeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swipe</Text>
      <Text style={styles.subtitle}>Job cards will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', color: '#1F2A37', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#5C6570', textAlign: 'center' },
});
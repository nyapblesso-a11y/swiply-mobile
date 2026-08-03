import { Image } from 'expo-image';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

const DURATION = 600;

const keyframe = new Keyframe({
  0: { transform: [{ scale: 1.3 }], opacity: 0 },
  40: { transform: [{ scale: 1.3 }], opacity: 0, easing: Easing.elastic(0.7) },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.elastic(0.7) },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={keyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/icon.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 128, height: 128 },
  image: { width: 76, height: 71 },
});
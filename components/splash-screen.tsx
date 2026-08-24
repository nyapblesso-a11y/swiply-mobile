import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';

// ── Configurable timing constants ────────────────────────────────
const BG_SHIFT_DURATION = 650;      // Phase 1: background color transition
const LETTER_STAGGER = 400;         // Phase 2: delay between each letter drop
const LETTER_SPRING = { damping: 11, stiffness: 170, mass: 0.9 };
const PAUSE_BEFORE_EXIT = 550;      // Hold once all letters have landed
const EXIT_DURATION = 450;          // Phase 3: swipe-off exit
const EXIT_EASING = Easing.in(Easing.cubic);

const COLOR_START = '#1F2A37'; // deep slate navy — initial empty state
const COLOR_END = '#FAF9F6';   // warm off-white — settled brand background
const LETTER_COLOR = '#1F2A37';

const LETTERS = ['S', 'W', 'I', 'P', 'L', 'Y'];
const { width: SCREEN_W } = Dimensions.get('window');

function Letter({ char, delay }: { char: string; delay: number }) {
  const translateY = useSharedValue(-160);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, LETTER_SPRING));
    opacity.value = withDelay(delay, withTiming(1, { duration: 180 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>
  );
}

export function SplashOverlay({ onFinish }: { onFinish: () => void }) {
  const [ready, setReady] = useState(false);
  const bgProgress = useSharedValue(0);
  const exitX = useSharedValue(0);

  const lastLetterDelay = useMemo(() => (LETTERS.length - 1) * LETTER_STAGGER, []);
  // Rough settle time for a spring with this config, used only for sequencing the exit.
  const SPRING_SETTLE_ESTIMATE = 550;

  useEffect(() => {
    if (!ready) return;

    // Phase 1: background shift, then kick off letters once it completes.
    bgProgress.value = withTiming(1, { duration: BG_SHIFT_DURATION }, (finished) => {
      if (finished) runOnJS(beginExitSequence)();
    });
  }, [ready]);

  function beginExitSequence() {
    const totalLetterTime = lastLetterDelay + SPRING_SETTLE_ESTIMATE;
    const timer = setTimeout(() => {
      exitX.value = withTiming(SCREEN_W, { duration: EXIT_DURATION, easing: EXIT_EASING }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }, totalLetterTime + PAUSE_BEFORE_EXIT);
    return () => clearTimeout(timer);
  }

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgProgress.value, [0, 1], [COLOR_START, COLOR_END]),
  }));

  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: exitX.value }],
  }));

  return (
    <Animated.View
      style={[styles.overlay, backgroundStyle, exitStyle]}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setReady(true));
      }}
    >
      {ready && (
        <View style={styles.lettersRow}>
          {LETTERS.map((char, i) => (
            <Letter key={char + i} char={char} delay={i * LETTER_STAGGER} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  lettersRow: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: 40,
    fontWeight: '700',
    color: LETTER_COLOR,
    letterSpacing: 1,
    marginHorizontal: 2,
  },
});
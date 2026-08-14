import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Svg, { Path } from 'react-native-svg';
import type { PathProps } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const PATH_LENGTH = 30;

const COLORS = {
  navy: '#1F2A37',
  teal: '#2F7864',
  terracotta: '#B5602F',
  bg: '#FAF9F6',
};

function LineDrawIcon() {
  const drawProgress = useSharedValue(0);

  useEffect(() => {
    drawProgress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, []);

const animatedProps = useAnimatedProps<PathProps>(() => ({
  strokeDashoffset: PATH_LENGTH * (1 - drawProgress.value),
  }));

  return (
    <Svg width={64} height={64} viewBox="0 0 24 24">
      <AnimatedPath
        d="M4 12h13M13 6l6 6-6 6"
        stroke={COLORS.navy}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={PATH_LENGTH}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

function IconBackdrop() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    opacity.value = withDelay(700, withTiming(1, { duration: 250 }));
    scale.value = withDelay(700, withTiming(1, { duration: 250, easing: Easing.out(Easing.back(1.2)) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.iconBackdrop, style]} />;
}

function DiamondSquare({
  delay,
  size,
  color,
  x,
  y,
}: {
  delay: number;
  size: number;
  color: string;
  x: number;
  y: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value * 0.85,
    transform: [
      { translateX: x },
      { translateY: y },
      { rotate: '45deg' },
      { scale: progress.value },
    ],
  }));

  return (
    <Animated.View
      style={[styles.diamond, { width: size, height: size, backgroundColor: color }, style]}
    />
  );
}

function buildSquares() {
  const rings = [
    { radius: 55, size: 22, delay: 900, colors: [COLORS.navy, COLORS.teal] },
    { radius: 95, size: 26, delay: 1150, colors: [COLORS.teal, COLORS.terracotta] },
    { radius: 135, size: 30, delay: 1400, colors: [COLORS.terracotta, COLORS.navy] },
  ];
  const squares: { key: string; delay: number; size: number; color: string; x: number; y: number }[] = [];

  rings.forEach((ring, ringIndex) => {
    const angles = [45, 135, 225, 315];
    angles.forEach((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      squares.push({
        key: `${ringIndex}-${i}`,
        delay: ring.delay + i * 60,
        size: ring.size,
        color: ring.colors[i % 2],
        x: Math.cos(rad) * ring.radius,
        y: Math.sin(rad) * ring.radius,
      });
    });
  });

  return squares;
}

function WelcomeText() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(2500, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(2500, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.textContainer, style]}>
      <Text style={styles.appName}>Swiply</Text>
      <Text style={styles.welcomeLine}>
        Welcome to Swiply — your next{'\n'}opportunity, one swipe away.
      </Text>
    </Animated.View>
  );
}

export function SplashOverlay() {
  const [layoutReady, setLayoutReady] = useState(false);
  const buildOpacity = useSharedValue(1);

  useEffect(() => {
    if (!layoutReady) return;
    buildOpacity.value = withDelay(2400, withTiming(0, { duration: 500 }));   
  }, [layoutReady]);

  const buildStyle = useAnimatedStyle(() => ({
    opacity: buildOpacity.value,
  }));

  const squares = buildSquares();

  return (
    <View
      style={styles.overlay}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setLayoutReady(true));
      }}
    >
      {layoutReady && (
        <>
          <Animated.View style={[styles.buildContainer, buildStyle]}>
            <View style={styles.center}>
              {squares.map((sq) => (
                <DiamondSquare key={sq.key} delay={sq.delay} size={sq.size} color={sq.color} x={sq.x} y={sq.y} />
              ))}
              <IconBackdrop />
              <View style={styles.iconWrapper}>
                <LineDrawIcon />
              </View>
            </View>
          </Animated.View>
          <WelcomeText />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  buildContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    position: 'absolute',
    borderRadius: 4,
  },
  iconBackdrop: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: '#E5E2DA',
  },
  iconWrapper: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  appName: {
    fontSize: 30,
    fontWeight: '600',
    color: COLORS.navy,
    letterSpacing: 1,
  },
  welcomeLine: {
    marginTop: 8,
    fontSize: 13,
    color: '#5C6570',
    textAlign: 'center',
    lineHeight: 18,
  },
});
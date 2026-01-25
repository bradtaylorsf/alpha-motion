import type { Example } from '../index';

export const counterCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

// ===== CUSTOMIZABLE CONSTANTS =====
const BACKGROUND_COLOR = '#0a192f';
const CARD_COLOR = '#112240';
const TEXT_COLOR = '#e6f1ff';
const ACCENT_COLOR = '#64ffda';
const LABEL_COLOR = '#8892b0';

const METRICS = [
  { label: 'Users', value: 10000, prefix: '', suffix: '+' },
  { label: 'Revenue', value: 50000, prefix: '$', suffix: '' },
  { label: 'Growth', value: 127, prefix: '', suffix: '%' },
];

const ANIMATION_DURATION = 60;
const STAGGER_DELAY = 10;

export const MyAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const cardWidth = (width - 160) / METRICS.length;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 40,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {METRICS.map((metric, i) => {
          const startFrame = i * STAGGER_DELAY;
          const localFrame = Math.max(0, frame - startFrame);

          // Card entrance animation
          const cardOpacity = interpolate(
            localFrame,
            [0, 20],
            [0, 1],
            { extrapolateRight: 'clamp' }
          );
          const cardY = interpolate(
            localFrame,
            [0, 20],
            [30, 0],
            { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
          );

          // Number counting animation
          const countProgress = interpolate(
            localFrame,
            [10, 10 + ANIMATION_DURATION],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
          );
          const displayValue = Math.floor(countProgress * metric.value);

          return (
            <div
              key={i}
              style={{
                backgroundColor: CARD_COLOR,
                borderRadius: 12,
                padding: 40,
                width: cardWidth,
                textAlign: 'center',
                opacity: cardOpacity,
                transform: \`translateY(\${cardY}px)\`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: ACCENT_COLOR,
                  fontFamily: 'monospace',
                  marginBottom: 10,
                }}
              >
                {metric.prefix}
                {displayValue.toLocaleString()}
                {metric.suffix}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: LABEL_COLOR,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  fontFamily: 'sans-serif',
                }}
              >
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default MyAnimation;`;

export const counterExample: Example = {
  id: 'counter',
  name: 'Metric Counters',
  description: 'Animated number counters with staggered card reveals',
  category: 'Data',
  code: counterCode,
  durationInFrames: 120,
  fps: 30,
};

import type { Example } from '../index';

export const textRotationCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

// ===== CUSTOMIZABLE CONSTANTS =====
const BACKGROUND_COLOR = '#0f0f0f';
const TEXT_COLOR = '#ffffff';
const ACCENT_COLOR = '#f59e0b';
const FONT_SIZE = 80;
const WORDS = ['Creative', 'Dynamic', 'Modern', 'Powerful'];
const FRAMES_PER_WORD = 60;
const TRANSITION_FRAMES = 15;

export const MyAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const wordIndex = Math.floor(frame / FRAMES_PER_WORD) % WORDS.length;
  const frameInWord = frame % FRAMES_PER_WORD;

  // Enter animation (first TRANSITION_FRAMES)
  const enterProgress = interpolate(
    frameInWord,
    [0, TRANSITION_FRAMES],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // Exit animation (last TRANSITION_FRAMES)
  const exitProgress = interpolate(
    frameInWord,
    [FRAMES_PER_WORD - TRANSITION_FRAMES, FRAMES_PER_WORD],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) }
  );

  // Combined opacity and transforms
  const opacity = enterProgress * (1 - exitProgress);
  const y = interpolate(enterProgress, [0, 1], [50, 0]) + interpolate(exitProgress, [0, 1], [0, -50]);
  const scale = interpolate(enterProgress, [0, 1], [0.8, 1]) * interpolate(exitProgress, [0, 1], [1, 0.8]);
  const blur = interpolate(enterProgress, [0, 1], [10, 0]) + interpolate(exitProgress, [0, 1], [0, 10]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Static text */}
      <div
        style={{
          position: 'absolute',
          fontSize: FONT_SIZE * 0.5,
          color: TEXT_COLOR,
          opacity: 0.5,
          top: '35%',
          fontFamily: 'sans-serif',
        }}
      >
        Design is
      </div>

      {/* Rotating word */}
      <div
        style={{
          fontSize: FONT_SIZE,
          fontWeight: 'bold',
          color: ACCENT_COLOR,
          fontFamily: 'sans-serif',
          transform: \`translateY(\${y}px) scale(\${scale})\`,
          opacity,
          filter: \`blur(\${blur}px)\`,
        }}
      >
        {WORDS[wordIndex]}
      </div>
    </AbsoluteFill>
  );
};

export default MyAnimation;`;

export const textRotationExample: Example = {
  id: 'text-rotation',
  name: 'Word Rotation',
  description: 'Rotating words with smooth dissolve and blur transitions',
  category: 'Text',
  code: textRotationCode,
  durationInFrames: 240,
  fps: 30,
};

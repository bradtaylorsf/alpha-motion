import type { Example } from '../index';

export const typewriterCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

// ===== CUSTOMIZABLE CONSTANTS =====
const BACKGROUND_COLOR = '#0a0a0a';
const TEXT_COLOR = '#ffffff';
const CURSOR_COLOR = '#3b82f6';
const FONT_SIZE = 64;
const TEXT_CONTENT = 'Hello, World!';
const CHARS_PER_SECOND = 10;
const CURSOR_BLINK_SPEED = 15; // frames per blink

export const MyAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate characters to show
  const charsPerFrame = CHARS_PER_SECOND / fps;
  const charsShown = Math.floor(frame * charsPerFrame);
  const visibleText = TEXT_CONTENT.slice(0, Math.min(charsShown, TEXT_CONTENT.length));

  // Cursor visibility (blinking)
  const cursorVisible = Math.floor(frame / CURSOR_BLINK_SPEED) % 2 === 0;
  const isTyping = charsShown < TEXT_CONTENT.length;
  const showCursor = isTyping || cursorVisible;

  // Fade in effect
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          fontFamily: 'monospace',
          fontSize: FONT_SIZE,
          color: TEXT_COLOR,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span>{visibleText}</span>
        <span
          style={{
            width: 3,
            height: FONT_SIZE,
            backgroundColor: CURSOR_COLOR,
            marginLeft: 2,
            opacity: showCursor ? 1 : 0,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default MyAnimation;`;

export const typewriterExample: Example = {
  id: 'typewriter',
  name: 'Typewriter Effect',
  description: 'Classic typewriter animation with blinking cursor',
  category: 'Text',
  code: typewriterCode,
  durationInFrames: 120,
  fps: 30,
};

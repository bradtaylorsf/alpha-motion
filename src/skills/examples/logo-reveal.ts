import type { Example } from '../index';

export const logoRevealCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

// ===== CUSTOMIZABLE CONSTANTS =====
const BACKGROUND_COLOR = '#000000';
const LOGO_COLOR = '#ffffff';
const GLOW_COLOR = '#3b82f6';
const FONT_SIZE = 120;
const COMPANY_NAME = 'ACME';
const TAGLINE = 'Innovation Redefined';

export const MyAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  // Logo rotation (subtle)
  const logoRotation = interpolate(
    spring({ frame, fps, config: { damping: 20, stiffness: 50 } }),
    [0, 1],
    [-5, 0]
  );

  // Glow pulse animation
  const glowIntensity = interpolate(
    frame,
    [30, 45, 60],
    [0, 30, 15],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tagline fade in
  const taglineOpacity = interpolate(
    frame,
    [45, 75],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const taglineY = interpolate(
    frame,
    [45, 75],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Letter stagger for logo
  const letters = COMPANY_NAME.split('');

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Logo letters */}
      <div
        style={{
          display: 'flex',
          transform: \`scale(\${logoScale}) rotate(\${logoRotation}deg)\`,
        }}
      >
        {letters.map((letter, i) => {
          const letterSpring = spring({
            frame: frame - i * 3,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          const letterScale = Math.max(0, letterSpring);
          const letterRotation = interpolate(letterSpring, [0, 1], [45, 0]);

          return (
            <span
              key={i}
              style={{
                fontSize: FONT_SIZE,
                fontWeight: 'bold',
                color: LOGO_COLOR,
                fontFamily: 'sans-serif',
                transform: \`scale(\${letterScale}) rotate(\${letterRotation}deg)\`,
                display: 'inline-block',
                textShadow: \`0 0 \${glowIntensity}px \${GLOW_COLOR}, 0 0 \${glowIntensity * 2}px \${GLOW_COLOR}\`,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: '35%',
          opacity: taglineOpacity,
          transform: \`translateY(\${taglineY}px)\`,
          fontSize: 24,
          color: LOGO_COLOR,
          letterSpacing: 8,
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
        }}
      >
        {TAGLINE}
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: 'absolute',
          bottom: '30%',
          width: interpolate(frame, [60, 90], [0, 200], { extrapolateRight: 'clamp' }),
          height: 2,
          backgroundColor: GLOW_COLOR,
          opacity: taglineOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

export default MyAnimation;`;

export const logoRevealExample: Example = {
  id: 'logo-reveal',
  name: 'Logo Reveal',
  description: 'Dramatic logo entrance with letter stagger and glow effects',
  category: 'Branding',
  code: logoRevealCode,
  durationInFrames: 120,
  fps: 30,
};

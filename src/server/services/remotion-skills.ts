/**
 * Curated Remotion patterns for the generation prompt.
 * Only includes patterns compatible with the in-browser compilation harness.
 *
 * Available runtime: React + core remotion (AbsoluteFill, useCurrentFrame,
 * useVideoConfig, interpolate, spring, Sequence, Series, Easing, Img, Audio,
 * Video, staticFile, delayRender, continueRender)
 */

export const REMOTION_SKILLS = `
## Remotion Animation Reference

### Animation Fundamentals

All animations MUST be driven by \`useCurrentFrame()\`. Write timing in seconds and multiply by \`fps\` from \`useVideoConfig()\`.

\`\`\`tsx
const frame = useCurrentFrame();
const { fps, width, height, durationInFrames } = useVideoConfig();

const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
  extrapolateRight: 'clamp',
});
\`\`\`

CSS transitions, CSS animations, and Tailwind animation classes are FORBIDDEN — they won't render correctly during video export.

---

### Interpolation & Clamping

Always clamp interpolations to prevent values from going outside the expected range:

\`\`\`tsx
const opacity = interpolate(frame, [0, 100], [0, 1], {
  extrapolateRight: 'clamp',
  extrapolateLeft: 'clamp',
});
\`\`\`

---

### Spring Animations

Springs go from 0 to 1 with natural motion. Default config: \`mass: 1, damping: 10, stiffness: 100\`.

\`\`\`tsx
const scale = spring({ frame, fps });
\`\`\`

Common spring configs:
\`\`\`tsx
const smooth = { damping: 200 };                          // Smooth, no bounce (subtle reveals)
const snappy = { damping: 20, stiffness: 200 };           // Snappy, minimal bounce (UI elements)
const bouncy = { damping: 8 };                            // Bouncy entrance (playful animations)
const heavy  = { damping: 15, stiffness: 80, mass: 2 };   // Heavy, slow, small bounce
\`\`\`

With delay:
\`\`\`tsx
const entrance = spring({ frame, fps, delay: 20, config: { damping: 200 } });
\`\`\`

With fixed duration:
\`\`\`tsx
const anim = spring({ frame, fps, durationInFrames: 40 });
\`\`\`

Combining spring() with interpolate() to map to custom ranges:
\`\`\`tsx
const springProgress = spring({ frame, fps });
const rotation = interpolate(springProgress, [0, 1], [0, 360]);
\`\`\`

Enter + exit pattern using spring subtraction:
\`\`\`tsx
const inAnim = spring({ frame, fps });
const outAnim = spring({ frame, fps, durationInFrames: 1 * fps, delay: durationInFrames - 1 * fps });
const scale = inAnim - outAnim;
\`\`\`

---

### Easing Functions

Apply easing curves to interpolate():
\`\`\`tsx
const value = interpolate(frame, [0, 100], [0, 1], {
  easing: Easing.inOut(Easing.quad),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
\`\`\`

Convexities: \`Easing.in\`, \`Easing.out\`, \`Easing.inOut\`
Curves (linear → most curved): \`Easing.quad\`, \`Easing.sin\`, \`Easing.exp\`, \`Easing.circle\`
Cubic bezier: \`Easing.bezier(0.8, 0.22, 0.96, 0.65)\`

---

### Sequencing

Use \`<Sequence>\` to control when elements appear. Inside a Sequence, \`useCurrentFrame()\` returns the LOCAL frame starting from 0.

\`\`\`tsx
const { fps } = useVideoConfig();

<Sequence from={0} durationInFrames={2 * fps}>
  <Scene1 />
</Sequence>
<Sequence from={2 * fps} durationInFrames={2 * fps}>
  <Scene2 />
</Sequence>
\`\`\`

Use \`layout="none"\` when items should not be wrapped in an AbsoluteFill:
\`\`\`tsx
<Sequence layout="none" from={15}>
  <Title />
</Sequence>
\`\`\`

Use \`<Series>\` when elements play one after another without overlap:
\`\`\`tsx
<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
  <Series.Sequence durationInFrames={30}>
    <Outro />
  </Series.Sequence>
</Series>
\`\`\`

Series with overlapping (negative offset):
\`\`\`tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneA />
  </Series.Sequence>
  <Series.Sequence offset={-15} durationInFrames={60}>
    <SceneB />
  </Series.Sequence>
</Series>
\`\`\`

Nested sequences for complex timing:
\`\`\`tsx
<Sequence from={0} durationInFrames={120}>
  <Background />
  <Sequence from={15} durationInFrames={90} layout="none">
    <Title />
  </Sequence>
  <Sequence from={45} durationInFrames={60} layout="none">
    <Subtitle />
  </Sequence>
</Sequence>
\`\`\`

---

### Trimming

Negative \`from\` trims the start (skips initial frames):
\`\`\`tsx
<Sequence from={-0.5 * fps}>
  <MyScene />  {/* useCurrentFrame() starts at 15 instead of 0 */}
</Sequence>
\`\`\`

Use \`durationInFrames\` to cut off the end:
\`\`\`tsx
<Sequence durationInFrames={1.5 * fps}>
  <MyScene />
</Sequence>
\`\`\`

---

### Staggered Animations

Animate multiple items with a delay between each:
\`\`\`tsx
const STAGGER_DELAY = 5;
const items = ['A', 'B', 'C', 'D'];

{items.map((item, i) => {
  const progress = spring({
    frame,
    fps,
    delay: i * STAGGER_DELAY,
    config: { damping: 200 },
  });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [20, 0]);
  return (
    <div key={i} style={{ opacity, transform: \`translateY(\${translateY}px)\` }}>
      {item}
    </div>
  );
})}
\`\`\`

---

### Typewriter Effect

Use string slicing driven by frame count. Never use per-character opacity.
\`\`\`tsx
const FULL_TEXT = 'Hello World';
const CHAR_FRAMES = 2;

const typedChars = Math.min(FULL_TEXT.length, Math.floor(frame / CHAR_FRAMES));
const visibleText = FULL_TEXT.slice(0, typedChars);

// Blinking cursor
const cursorOpacity = interpolate(
  frame % 16,
  [0, 8, 16],
  [1, 0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);
\`\`\`

Advanced typewriter with pause after first sentence:
\`\`\`tsx
const PAUSE_AFTER = 'First sentence.';
const PAUSE_FRAMES = fps * 1; // 1 second pause

const pauseIndex = FULL_TEXT.indexOf(PAUSE_AFTER);
const preLen = pauseIndex >= 0 ? pauseIndex + PAUSE_AFTER.length : FULL_TEXT.length;

let typedChars = 0;
if (frame < preLen * CHAR_FRAMES) {
  typedChars = Math.floor(frame / CHAR_FRAMES);
} else if (frame < preLen * CHAR_FRAMES + PAUSE_FRAMES) {
  typedChars = preLen;
} else {
  const postPhase = frame - preLen * CHAR_FRAMES - PAUSE_FRAMES;
  typedChars = Math.min(FULL_TEXT.length, preLen + Math.floor(postPhase / CHAR_FRAMES));
}
\`\`\`

---

### Word Highlighting (Highlighter Pen Effect)

Spring-animated wipe effect behind a word:
\`\`\`tsx
const HIGHLIGHT_COLOR = '#A7C7E7';
const HIGHLIGHT_START = 30;

const highlightProgress = spring({
  fps,
  frame,
  config: { damping: 200 },
  delay: HIGHLIGHT_START,
  durationInFrames: 18,
});
const scaleX = Math.max(0, Math.min(1, highlightProgress));

<span style={{ position: 'relative', display: 'inline-block' }}>
  <span style={{
    position: 'absolute', left: 0, right: 0,
    top: '50%', height: '1.05em',
    transform: \`translateY(-50%) scaleX(\${scaleX})\`,
    transformOrigin: 'left center',
    backgroundColor: HIGHLIGHT_COLOR,
    borderRadius: '0.18em', zIndex: 0,
  }} />
  <span style={{ position: 'relative', zIndex: 1 }}>highlighted word</span>
</span>
\`\`\`

---

### Bar Chart Animation

Staggered animated bars using spring() for height:
\`\`\`tsx
const data = [
  { label: 'Jan', value: 2039 },
  { label: 'Mar', value: 2160 },
  { label: 'May', value: 2327 },
];
const maxValue = Math.max(...data.map(d => d.value));
const CHART_HEIGHT = 400;

{data.map((item, i) => {
  const progress = spring({
    frame: frame - i * 5 - 10,
    fps,
    config: { damping: 18, stiffness: 80 },
  });
  const barHeight = (item.value / maxValue) * CHART_HEIGHT * progress;
  return (
    <div key={item.label} style={{
      width: 60, height: barHeight,
      backgroundColor: '#D4AF37',
      borderRadius: '8px 8px 0 0',
      opacity: progress,
    }} />
  );
})}
\`\`\`

### Pie Chart Animation

Animate SVG circle segments using stroke-dashoffset, starting from 12 o'clock:
\`\`\`tsx
const progress = interpolate(frame, [0, 100], [0, 1], { extrapolateRight: 'clamp' });
const circumference = 2 * Math.PI * radius;
const segmentLength = (value / total) * circumference;
const offset = interpolate(progress, [0, 1], [segmentLength, 0]);

<circle
  r={radius} cx={center} cy={center}
  fill="none" stroke={color} strokeWidth={strokeWidth}
  strokeDasharray={\`\${segmentLength} \${circumference}\`}
  strokeDashoffset={offset}
  transform={\`rotate(-90 \${center} \${center})\`}
/>
\`\`\`

---

### Images

Use the \`<Img>\` component from remotion (NOT native \`<img>\`):
\`\`\`tsx
<Img src="https://example.com/photo.png" style={{ width: 500, height: 300, objectFit: 'cover' }} />
\`\`\`

For local assets served by the app, use the asset URL directly:
\`\`\`tsx
<Img src="/assets/generated/my-image.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
\`\`\`

---

### Fonts

Do NOT use \`@remotion/google-fonts\`. Instead, load Google Fonts via a \`<style>\` element:

\`\`\`tsx
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';

const MyAnimation: React.FC = () => {
  return (
    <AbsoluteFill>
      <style>{\`@import url('\${FONT_URL}');\`}</style>
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        Text with Google Font
      </div>
    </AbsoluteFill>
  );
};
\`\`\`

Or use web-safe fonts: Arial, Helvetica, Georgia, Times New Roman, Courier New, Verdana, sans-serif, serif, monospace.

---

### Scene Transitions (Manual)

Since \`@remotion/transitions\` is NOT available, implement transitions manually:

Fade transition between scenes:
\`\`\`tsx
const SCENE_1_END = 60;
const FADE_DURATION = 15;

const scene1Opacity = interpolate(frame, [SCENE_1_END - FADE_DURATION, SCENE_1_END], [1, 0], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
const scene2Opacity = interpolate(frame, [SCENE_1_END - FADE_DURATION, SCENE_1_END], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
});
\`\`\`

Slide transition:
\`\`\`tsx
const slideProgress = interpolate(frame, [SCENE_1_END - 20, SCENE_1_END], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.inOut(Easing.quad),
});
const scene1X = interpolate(slideProgress, [0, 1], [0, -width]);
const scene2X = interpolate(slideProgress, [0, 1], [width, 0]);
\`\`\`
`;

# Transitions

## Impact: MEDIUM
Smooth transitions between scenes maintain viewer engagement and create professional polish.

## Tags: fade, slide, wipe, zoom, transition, scene

---

### Using @remotion/transitions

**Correct approach:**
```tsx
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneOne />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneTwo />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

---

### Manual Fade Transition

**When you need more control:**
```tsx
const FADE_START = 50;
const FADE_DURATION = 10;

const scene1Opacity = interpolate(
  frame,
  [FADE_START, FADE_START + FADE_DURATION],
  [1, 0],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);

const scene2Opacity = interpolate(
  frame,
  [FADE_START, FADE_START + FADE_DURATION],
  [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);

<AbsoluteFill>
  <div style={{ opacity: scene1Opacity }}><Scene1 /></div>
  <div style={{ opacity: scene2Opacity }}><Scene2 /></div>
</AbsoluteFill>
```

---

### Slide Transition

**Correct approach:**
```tsx
const SLIDE_DURATION = 20;

const scene1X = interpolate(
  frame,
  [60, 60 + SLIDE_DURATION],
  [0, -width],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);

const scene2X = interpolate(
  frame,
  [60, 60 + SLIDE_DURATION],
  [width, 0],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);

<AbsoluteFill>
  <div style={{ transform: `translateX(${scene1X}px)` }}><Scene1 /></div>
  <div style={{ transform: `translateX(${scene2X}px)` }}><Scene2 /></div>
</AbsoluteFill>
```

---

### Zoom/Scale Transition

**Correct approach:**
```tsx
const ZOOM_START = 60;
const ZOOM_DURATION = 15;

const scale = interpolate(
  frame,
  [ZOOM_START, ZOOM_START + ZOOM_DURATION],
  [1, 3],
  { extrapolateRight: 'clamp' }
);

const opacity = interpolate(
  frame,
  [ZOOM_START, ZOOM_START + ZOOM_DURATION],
  [1, 0],
  { extrapolateRight: 'clamp' }
);

<div style={{
  transform: `scale(${scale})`,
  opacity,
  transformOrigin: 'center center'
}}>
  <Scene1 />
</div>
```

---

### Wipe Transition

**Correct approach using clip-path:**
```tsx
const wipeProgress = interpolate(
  frame,
  [60, 80],
  [0, 100],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
);

<AbsoluteFill>
  <Scene1 />
  <div style={{ clipPath: `inset(0 ${100 - wipeProgress}% 0 0)` }}>
    <Scene2 />
  </div>
</AbsoluteFill>
```

---

### Transition Best Practices

1. **Keep transitions short** - 10-20 frames (0.3-0.7 seconds) typically
2. **Match transition to content** - fade for mood, slide for progression
3. **Use consistent timing** - same duration throughout video
4. **Consider easing** - ease-out for exits, ease-in for entrances
5. **Don't overuse** - simple cuts are often more effective

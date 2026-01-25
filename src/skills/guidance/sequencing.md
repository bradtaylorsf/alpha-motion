# Sequencing & Orchestration

## Impact: HIGH
Proper sequencing creates rhythm and guides viewer attention through complex animations.

## Tags: sequence, timeline, orchestration, timing, composition

---

### Using Remotion Sequence

**Basic usage:**
```tsx
import { Sequence, AbsoluteFill } from 'remotion';

<AbsoluteFill>
  <Sequence from={0} durationInFrames={60}>
    <IntroScene />
  </Sequence>

  <Sequence from={60} durationInFrames={90}>
    <MainContent />
  </Sequence>

  <Sequence from={150} durationInFrames={30}>
    <OutroScene />
  </Sequence>
</AbsoluteFill>
```

Within each Sequence, `useCurrentFrame()` returns frame relative to that sequence's start.

---

### Overlapping Sequences

**For transitions and layered effects:**
```tsx
<AbsoluteFill>
  <Sequence from={0} durationInFrames={70}>
    <Scene1 />
  </Sequence>

  {/* Overlaps with Scene1 for crossfade */}
  <Sequence from={60} durationInFrames={70}>
    <Scene2 />
  </Sequence>
</AbsoluteFill>
```

---

### Named Timing Constants

**Correct approach:**
```tsx
// Define all timing at the top
const INTRO_START = 0;
const INTRO_DURATION = 60;
const TITLE_START = INTRO_START + 20;
const MAIN_START = INTRO_DURATION;
const MAIN_DURATION = 120;
const OUTRO_START = MAIN_START + MAIN_DURATION;
const OUTRO_DURATION = 30;

<AbsoluteFill>
  <Sequence from={INTRO_START} durationInFrames={INTRO_DURATION}>
    <Intro />
  </Sequence>

  <Sequence from={TITLE_START} durationInFrames={40}>
    <Title />
  </Sequence>

  <Sequence from={MAIN_START} durationInFrames={MAIN_DURATION}>
    <MainContent />
  </Sequence>

  <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
    <Outro />
  </Sequence>
</AbsoluteFill>
```

---

### Conditional Rendering Based on Frame

**When Sequences are too rigid:**
```tsx
const frame = useCurrentFrame();

const showIntro = frame < 60;
const showMain = frame >= 45 && frame < 150;
const showOutro = frame >= 140;

<AbsoluteFill>
  {showIntro && <Intro frame={frame} />}
  {showMain && <MainContent frame={frame - 45} />}
  {showOutro && <Outro frame={frame - 140} />}
</AbsoluteFill>
```

---

### Building a Timeline Component

**Reusable pattern:**
```tsx
interface TimelineItem {
  component: React.FC<{ frame: number }>;
  start: number;
  duration: number;
}

const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => {
  return (
    <AbsoluteFill>
      {items.map((item, i) => (
        <Sequence key={i} from={item.start} durationInFrames={item.duration}>
          <item.component frame={0} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Usage
const timeline: TimelineItem[] = [
  { component: Intro, start: 0, duration: 60 },
  { component: Title, start: 30, duration: 40 },
  { component: Content, start: 60, duration: 90 },
];

<Timeline items={timeline} />
```

---

### Orchestrating Staggered Elements

**Correct approach:**
```tsx
const items = ['First', 'Second', 'Third', 'Fourth'];
const SEQUENCE_START = 30;
const ITEM_DURATION = 20;
const STAGGER = 10;

<AbsoluteFill>
  {items.map((item, i) => (
    <Sequence
      key={i}
      from={SEQUENCE_START + (i * STAGGER)}
      durationInFrames={ITEM_DURATION + ((items.length - i) * STAGGER)}
    >
      <AnimatedItem text={item} />
    </Sequence>
  ))}
</AbsoluteFill>
```

---

### Sequencing Best Practices

1. **Define timing as constants** - makes adjustments easy
2. **Use relative timing** - `SECTION_2_START = SECTION_1_START + SECTION_1_DURATION`
3. **Document your timeline** - add comments showing frame ranges
4. **Test at boundaries** - ensure smooth transitions between sequences
5. **Consider the rhythm** - alternate between fast and slow sections
6. **Leave breathing room** - don't pack every frame with motion

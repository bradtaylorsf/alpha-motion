# Typography & Text Animation

## Impact: HIGH
Text animations are core to motion graphics. Proper techniques prevent jank and ensure smooth rendering.

## Tags: text, typewriter, kinetic, reveal, word-by-word

---

### Typewriter Effect

**Incorrect:**
```tsx
// Using setTimeout or state updates
const [text, setText] = useState('');
useEffect(() => {
  const interval = setInterval(() => setText(t => t + fullText[t.length]), 100);
  return () => clearInterval(interval);
}, []);
```

**Correct:**
```tsx
const frame = useCurrentFrame();
const fullText = "Hello World";
const CHARS_PER_FRAME = 0.5;
const charsShown = Math.floor(frame * CHARS_PER_FRAME);
const visibleText = fullText.slice(0, Math.min(charsShown, fullText.length));
```

Frame-based calculation is deterministic and renders correctly at any frame.

---

### Word-by-Word Reveal

**Incorrect:**
```tsx
// Animating all words with same timing
{words.map((word, i) => (
  <span style={{ opacity: interpolate(frame, [0, 30], [0, 1]) }}>{word}</span>
))}
```

**Correct:**
```tsx
const WORD_DELAY = 8; // frames between words
const FADE_DURATION = 15;

{words.map((word, i) => {
  const wordStart = i * WORD_DELAY;
  const opacity = interpolate(
    frame,
    [wordStart, wordStart + FADE_DURATION],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return <span key={i} style={{ opacity }}>{word} </span>;
})}
```

Staggered timing creates engaging sequential reveals.

---

### Text Scaling/Zoom

**Incorrect:**
```tsx
// Linear scaling feels mechanical
const scale = interpolate(frame, [0, 30], [0, 1]);
```

**Correct:**
```tsx
const scale = spring({
  frame,
  fps,
  config: { damping: 12, stiffness: 100, mass: 0.5 },
});
```

Spring physics creates natural, organic scaling motion.

---

### Highlight/Emphasis Animation

**Correct approach:**
```tsx
const HIGHLIGHT_START = 30;
const HIGHLIGHT_DURATION = 20;
const highlightWidth = interpolate(
  frame,
  [HIGHLIGHT_START, HIGHLIGHT_START + HIGHLIGHT_DURATION],
  [0, 100],
  { extrapolateRight: 'clamp' }
);

<span style={{ position: 'relative' }}>
  Important Text
  <span style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: `${highlightWidth}%`,
    height: 8,
    backgroundColor: '#ffeb3b',
    zIndex: -1,
  }} />
</span>
```

---

### Kinetic Typography Best Practices

1. **Always define timing constants** at component top
2. **Use consistent easing** across related elements
3. **Consider reading rhythm** - text should be readable at crucial moments
4. **Layer animations** - combine position, opacity, and scale for richness
5. **Use Google Fonts** for consistent cross-platform rendering:

```tsx
import { loadFont } from '@remotion/google-fonts/Inter';
const { fontFamily } = loadFont();

<div style={{ fontFamily }}>Text</div>
```

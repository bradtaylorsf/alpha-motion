# Spring Physics

## Impact: HIGH
Spring animations create organic, natural-feeling motion that engages viewers.

## Tags: spring, bounce, elastic, physics, natural-motion

---

### Basic Spring Usage

**Incorrect:**
```tsx
// Linear interpolation feels mechanical
const scale = interpolate(frame, [0, 30], [0, 1]);
```

**Correct:**
```tsx
import { spring } from 'remotion';

const scale = spring({
  frame,
  fps,
  config: {
    damping: 200,    // Higher = less bounce
    stiffness: 100,  // Higher = faster
    mass: 1,         // Higher = more momentum
  },
});
```

---

### Spring Configurations

**Snappy (buttons, UI elements):**
```tsx
const config = { damping: 200, stiffness: 200, mass: 0.5 };
```

**Bouncy (playful, attention-grabbing):**
```tsx
const config = { damping: 10, stiffness: 100, mass: 1 };
```

**Smooth (elegant, professional):**
```tsx
const config = { damping: 30, stiffness: 80, mass: 1 };
```

**Heavy (dramatic, impactful):**
```tsx
const config = { damping: 15, stiffness: 50, mass: 3 };
```

---

### Delayed Spring

**Correct approach:**
```tsx
const DELAY_FRAMES = 15;

const scale = spring({
  frame: frame - DELAY_FRAMES,
  fps,
  config: { damping: 200 },
});

// Clamp to prevent negative spring values
const clampedScale = Math.max(0, scale);
```

---

### Staggered Springs

**Correct approach:**
```tsx
const items = ['A', 'B', 'C', 'D', 'E'];
const STAGGER = 5;

{items.map((item, i) => {
  const itemScale = spring({
    frame: frame - (i * STAGGER),
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      key={i}
      style={{ transform: `scale(${Math.max(0, itemScale)})` }}
    >
      {item}
    </div>
  );
})}
```

---

### Spring for Position

**Correct approach:**
```tsx
const x = spring({
  frame,
  fps,
  config: { damping: 20, stiffness: 100 },
  from: -200,  // Start position
  to: 0,       // End position
});

<div style={{ transform: `translateX(${x}px)` }}>
  Content
</div>
```

---

### Combining Springs

**Correct approach:**
```tsx
const scaleSpring = spring({
  frame,
  fps,
  config: { damping: 15, stiffness: 100 },
});

const rotationSpring = spring({
  frame,
  fps,
  config: { damping: 20, stiffness: 80 },
  from: -45,
  to: 0,
});

const opacitySpring = spring({
  frame,
  fps,
  config: { damping: 200, stiffness: 100 },
});

<div style={{
  transform: `scale(${scaleSpring}) rotate(${rotationSpring}deg)`,
  opacity: opacitySpring,
}}>
  Content
</div>
```

---

### Spring Best Practices

1. **Always pass `fps`** from `useVideoConfig()` for correct timing
2. **Clamp spring values** when using delays to prevent negative values
3. **Use similar configs** for related elements to maintain visual consistency
4. **Consider mass** - heavier objects should move slower
5. **Test at different playback speeds** - springs should look good at 0.5x and 2x

```tsx
// Good pattern: define configs as constants
const BUTTON_SPRING = { damping: 200, stiffness: 200, mass: 0.5 };
const CONTENT_SPRING = { damping: 30, stiffness: 80, mass: 1 };

const buttonScale = spring({ frame, fps, config: BUTTON_SPRING });
const contentScale = spring({ frame, fps, config: CONTENT_SPRING });
```

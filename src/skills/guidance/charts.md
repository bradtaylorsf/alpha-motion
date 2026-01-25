# Charts & Data Visualization

## Impact: HIGH
Animated charts communicate data effectively. Proper animation sequencing prevents confusion.

## Tags: bar-chart, line-chart, pie-chart, data-viz, histogram

---

### Animated Bar Chart

**Incorrect:**
```tsx
// All bars animate simultaneously - hard to follow
{data.map((item, i) => (
  <div style={{ height: interpolate(frame, [0, 30], [0, item.value]) }} />
))}
```

**Correct:**
```tsx
const BAR_DELAY = 5; // frames between bars
const BAR_DURATION = 20;

{data.map((item, i) => {
  const barStart = i * BAR_DELAY;
  const height = spring({
    frame: frame - barStart,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const clampedHeight = Math.max(0, Math.min(height, 1));

  return (
    <div
      key={i}
      style={{
        height: `${clampedHeight * item.value}%`,
        backgroundColor: item.color,
      }}
    />
  );
})}
```

Staggered animations guide the viewer through the data.

---

### Line Chart Animation

**Correct approach using SVG:**
```tsx
const points = data.map((d, i) => `${i * xStep},${height - d.value}`).join(' ');
const totalLength = 1000; // Approximate path length

const dashOffset = interpolate(
  frame,
  [0, 60],
  [totalLength, 0],
  { extrapolateRight: 'clamp' }
);

<svg>
  <polyline
    points={points}
    fill="none"
    stroke="#3b82f6"
    strokeWidth={3}
    strokeDasharray={totalLength}
    strokeDashoffset={dashOffset}
  />
</svg>
```

---

### Pie Chart Animation

**Correct approach:**
```tsx
const data = [
  { value: 30, color: '#3b82f6' },
  { value: 45, color: '#10b981' },
  { value: 25, color: '#f59e0b' },
];

let cumulativeAngle = 0;

{data.map((slice, i) => {
  const sliceAngle = (slice.value / 100) * 360;
  const animatedAngle = interpolate(
    frame,
    [i * 15, i * 15 + 30],
    [0, sliceAngle],
    { extrapolateRight: 'clamp' }
  );

  const startAngle = cumulativeAngle;
  cumulativeAngle += sliceAngle;

  return (
    <PieSlice
      key={i}
      startAngle={startAngle}
      endAngle={startAngle + animatedAngle}
      color={slice.color}
    />
  );
})}
```

---

### Number Counter Animation

**Correct approach:**
```tsx
const TARGET_VALUE = 10000;
const ANIMATION_DURATION = 60;

const progress = interpolate(
  frame,
  [0, ANIMATION_DURATION],
  [0, 1],
  { extrapolateRight: 'clamp' }
);

// Use easing for more natural counting
const easedProgress = Easing.out(Easing.cubic)(progress);
const displayValue = Math.floor(easedProgress * TARGET_VALUE);

<span>{displayValue.toLocaleString()}</span>
```

---

### Data Visualization Best Practices

1. **Animate data in logical order** - left to right, low to high, or by importance
2. **Use color meaningfully** - consistent palette, highlight key data
3. **Include labels** - animate labels with their data points
4. **Consider timing** - important data should be visible longer
5. **Use axis animations** - animate grid lines before data for context

```tsx
// Animate axis first, then data
const axisOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
const dataStart = 20;

<g style={{ opacity: axisOpacity }}>
  <Axis />
</g>
<g>
  <DataBars startFrame={dataStart} />
</g>
```

# Social Media Content

## Impact: MEDIUM
Platform-specific formats and styles for Instagram, TikTok, YouTube Shorts.

## Tags: instagram, tiktok, reels, stories, shorts, vertical

---

### Aspect Ratios

**Platform dimensions:**
```tsx
// Instagram/TikTok Stories & Reels
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

// YouTube Shorts
const SHORTS_WIDTH = 1080;
const SHORTS_HEIGHT = 1920;

// Instagram Square Post
const SQUARE_SIZE = 1080;

// Instagram Landscape Post
const LANDSCAPE_WIDTH = 1080;
const LANDSCAPE_HEIGHT = 566;

// YouTube Landscape
const YT_WIDTH = 1920;
const YT_HEIGHT = 1080;
```

---

### Safe Zones for Stories/Reels

**Account for UI overlays:**
```tsx
const SAFE_TOP = 150;     // Username, time
const SAFE_BOTTOM = 250;  // Comments, buttons
const SAFE_SIDES = 50;    // Edge padding

<AbsoluteFill>
  <div style={{
    padding: `${SAFE_TOP}px ${SAFE_SIDES}px ${SAFE_BOTTOM}px`,
    height: '100%',
    boxSizing: 'border-box',
  }}>
    {/* Content stays within safe zone */}
  </div>
</AbsoluteFill>
```

---

### Vertical Text Layout

**Optimized for mobile viewing:**
```tsx
const FONT_SIZE = 72;  // Larger for mobile
const LINE_HEIGHT = 1.2;

<div style={{
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  textAlign: 'center',
  padding: '0 60px',
  wordBreak: 'break-word',
}}>
  Your text content here
</div>
```

---

### Engaging Hook Pattern

**First 3 seconds are critical:**
```tsx
const HOOK_DURATION = 90; // 3 seconds at 30fps

<AbsoluteFill>
  {/* Attention-grabbing hook */}
  <Sequence from={0} durationInFrames={HOOK_DURATION}>
    <Hook />
  </Sequence>

  {/* Main content */}
  <Sequence from={HOOK_DURATION}>
    <MainContent />
  </Sequence>
</AbsoluteFill>

// Hook component with fast animation
const Hook = () => {
  const frame = useCurrentFrame();
  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 200 },
  });

  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{ transform: `scale(${scale})`, fontSize: 120 }}>
        WAIT...
      </div>
    </AbsoluteFill>
  );
};
```

---

### Progress Indicator

**Show video length:**
```tsx
const { durationInFrames } = useVideoConfig();
const progress = (frame / durationInFrames) * 100;

<div style={{
  position: 'absolute',
  top: 20,
  left: 20,
  right: 20,
  height: 4,
  backgroundColor: 'rgba(255,255,255,0.3)',
  borderRadius: 2,
}}>
  <div style={{
    width: `${progress}%`,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  }} />
</div>
```

---

### Call-to-Action Overlay

**End screen pattern:**
```tsx
const CTA_START = durationInFrames - 60;

<Sequence from={CTA_START}>
  <AbsoluteFill style={{
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>
        Follow for more!
      </div>
      <div style={{ fontSize: 32, opacity: 0.8 }}>
        @yourusername
      </div>
    </div>
  </AbsoluteFill>
</Sequence>
```

---

### Social Media Best Practices

1. **Hook in first 2-3 seconds** - most crucial for retention
2. **Use large, readable text** - mobile screens are small
3. **Keep animations fast** - social attention spans are short
4. **Loop-friendly** - design endings that connect to beginnings
5. **Test on device** - preview on actual phone screens
6. **Mind the safe zones** - UI elements cover edges
7. **Sound optional** - many watch muted, use text overlays

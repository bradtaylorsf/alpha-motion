import type { Example } from '../index';

export const barChartCode = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

// ===== CUSTOMIZABLE CONSTANTS =====
const BACKGROUND_COLOR = '#1a1a2e';
const BAR_COLORS = ['#e94560', '#0f3460', '#16c79a', '#f9a825', '#7b2cbf'];
const TEXT_COLOR = '#ffffff';
const GRID_COLOR = 'rgba(255, 255, 255, 0.1)';
const CHART_TITLE = 'Monthly Sales';
const FONT_SIZE = 24;

const DATA = [
  { label: 'Jan', value: 65 },
  { label: 'Feb', value: 45 },
  { label: 'Mar', value: 80 },
  { label: 'Apr', value: 55 },
  { label: 'May', value: 90 },
];

const BAR_DELAY = 5; // frames between each bar
const CHART_PADDING = 60;
const BAR_GAP = 20;

export const MyAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const chartWidth = width - CHART_PADDING * 2;
  const chartHeight = height - CHART_PADDING * 3;
  const barWidth = (chartWidth - BAR_GAP * (DATA.length + 1)) / DATA.length;
  const maxValue = Math.max(...DATA.map((d) => d.value));

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: CHART_PADDING / 2,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: TEXT_COLOR,
          fontSize: FONT_SIZE * 1.5,
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
        }}
      >
        {CHART_TITLE}
      </div>

      {/* Grid lines */}
      <svg
        style={{
          position: 'absolute',
          top: CHART_PADDING * 1.5,
          left: CHART_PADDING,
          width: chartWidth,
          height: chartHeight,
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={0}
            y1={chartHeight * (1 - ratio)}
            x2={chartWidth}
            y2={chartHeight * (1 - ratio)}
            stroke={GRID_COLOR}
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Bars */}
      {DATA.map((item, i) => {
        const barSpring = spring({
          frame: frame - i * BAR_DELAY,
          fps,
          config: { damping: 15, stiffness: 80 },
        });
        const barHeight = Math.max(0, barSpring) * (item.value / maxValue) * chartHeight;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: CHART_PADDING,
              left: CHART_PADDING + BAR_GAP + i * (barWidth + BAR_GAP),
              width: barWidth,
              height: barHeight,
              backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
              borderRadius: 4,
              transformOrigin: 'bottom',
            }}
          />
        );
      })}

      {/* Labels */}
      {DATA.map((item, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: CHART_PADDING - 30,
            left: CHART_PADDING + BAR_GAP + i * (barWidth + BAR_GAP),
            width: barWidth,
            textAlign: 'center',
            color: TEXT_COLOR,
            fontSize: FONT_SIZE * 0.8,
            fontFamily: 'sans-serif',
          }}
        >
          {item.label}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export default MyAnimation;`;

export const barChartExample: Example = {
  id: 'bar-chart',
  name: 'Animated Bar Chart',
  description: 'Data visualization with staggered bar animations using spring physics',
  category: 'Charts',
  code: barChartCode,
  durationInFrames: 90,
  fps: 30,
};

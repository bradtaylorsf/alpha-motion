import { Composition } from 'remotion';
import { DynamicComponent } from './DynamicComponent';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicComp"
        component={DynamicComponent}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          code: `
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ color: 'white', fontSize: 64, opacity }}>
        Hello Remotion!
      </div>
    </AbsoluteFill>
  );
};

export default MyAnimation;
          `.trim(),
        }}
      />
    </>
  );
};

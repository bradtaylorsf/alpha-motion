import { AbsoluteFill } from 'remotion';

interface DynamicComponentProps {
  code: string;
}

// This is a placeholder for the Remotion Studio
// The actual dynamic compilation happens in the browser preview
export const DynamicComponent: React.FC<DynamicComponentProps> = ({ code }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div style={{ color: 'white', fontSize: 32 }}>Remotion Studio</div>
      <div style={{ color: '#888', fontSize: 16 }}>
        Dynamic preview available in the web app
      </div>
    </AbsoluteFill>
  );
};

import React, { useState, useMemo } from 'react';
import { Player } from '@remotion/player';
import * as Babel from '@babel/standalone';
import * as Remotion from 'remotion';

interface RemotionPreviewProps {
  sourceCode: string;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
}

// Create a component factory that compiles source code
function compileComponent(sourceCode: string): React.FC | null {
  try {
    // Strip out import/export statements - we'll inject the dependencies
    const codeWithoutModules = sourceCode
      // Remove import statements
      .replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      // Remove "export default X;" at end
      .replace(/^export\s+default\s+\w+;?\s*$/gm, '')
      // Convert "export const X" -> "const X"
      .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ')
      // Remove "export { X, Y };"
      .replace(/^export\s+\{[^}]*\};?\s*$/gm, '');

    // Transform JSX/TypeScript to JavaScript
    const transformed = Babel.transform(codeWithoutModules, {
      presets: ['react', 'typescript'],
      filename: 'component.tsx',
    });

    if (!transformed.code) {
      throw new Error('Babel transformation produced no code');
    }

    // Create a function that returns the component
    // We inject React and Remotion dependencies
    const wrappedCode = `
      const { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Easing, Img, Audio, Video, staticFile, delayRender, continueRender } = Remotion;

      ${transformed.code}

      return typeof MyAnimation !== 'undefined' ? MyAnimation : (typeof exports !== 'undefined' && exports.default ? exports.default : null);
    `;

    // Create a function with React and Remotion in scope
    const factory = new Function('React', 'Remotion', 'exports', wrappedCode);
    const exports: { default?: React.FC } = {};
    const Component = factory(React, Remotion, exports);

    if (!Component) {
      throw new Error('Component not found - make sure to export MyAnimation');
    }

    return Component;
  } catch (error) {
    console.error('Failed to compile component:', error);
    throw error; // Re-throw so the UI can show the error message
  }
}

export function RemotionPreview({
  sourceCode,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames = 150,
}: RemotionPreviewProps) {
  const [error, setError] = useState<string | null>(null);

  // Compile component - memoize to avoid recompilation
  const CompiledComponent = useMemo(() => {
    setError(null);
    try {
      const component = compileComponent(sourceCode);
      if (!component) {
        setError('Failed to compile component');
        return null;
      }
      return component;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return null;
    }
  }, [sourceCode]);

  // Calculate aspect ratio for responsive display
  const aspectRatio = width / height;
  const containerStyle = {
    width: '100%',
    maxWidth: Math.min(width, 960),
    aspectRatio: `${aspectRatio}`,
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="font-semibold text-destructive mb-2">Preview Error</h3>
        <pre className="text-sm text-destructive/80 whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!CompiledComponent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={containerStyle} className="rounded-lg overflow-hidden bg-black shadow-lg">
        <ErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full bg-destructive/10 text-destructive p-4">
              Component crashed during render
            </div>
          }
        >
          <Player
            component={CompiledComponent}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionWidth={width}
            compositionHeight={height}
            style={{ width: '100%', height: '100%' }}
            controls
            loop
            autoPlay
          />
        </ErrorBoundary>
      </div>
      <p className="text-sm text-muted-foreground">
        Use the controls to play, pause, and scrub through the animation
      </p>
    </div>
  );
}

// Simple error boundary for catching render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Component error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}


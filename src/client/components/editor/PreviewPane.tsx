import { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import * as Babel from '@babel/standalone';
import * as React from 'react';
import * as Remotion from 'remotion';

interface PreviewPaneProps {
  sourceCode: string;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
}

function compileComponent(sourceCode: string): React.FC | null {
  try {
    const codeWithoutModules = sourceCode
      .replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^export\s+default\s+\w+;?\s*$/gm, '')
      .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ')
      .replace(/^export\s+\{[^}]*\};?\s*$/gm, '');

    const transformed = Babel.transform(codeWithoutModules, {
      presets: ['react', 'typescript'],
      filename: 'component.tsx',
    });

    if (!transformed.code) {
      throw new Error('Babel transformation produced no code');
    }

    const wrappedCode = `
      const { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Easing, Img, Audio, Video, staticFile, delayRender, continueRender } = Remotion;

      ${transformed.code}

      return typeof MyAnimation !== 'undefined' ? MyAnimation : (typeof exports !== 'undefined' && exports.default ? exports.default : null);
    `;

    const factory = new Function('React', 'Remotion', 'exports', wrappedCode);
    const exports: { default?: React.FC } = {};
    const Component = factory(React, Remotion, exports);

    if (!Component) {
      throw new Error('Component not found - make sure to export MyAnimation');
    }

    return Component;
  } catch (error) {
    console.error('Failed to compile component:', error);
    throw error;
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
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

export function PreviewPane({
  sourceCode,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames = 150,
}: PreviewPaneProps) {
  const [error, setError] = useState<string | null>(null);

  const CompiledComponent = useMemo(() => {
    setError(null);
    if (!sourceCode.trim()) {
      return null;
    }
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

  const aspectRatio = width / height;

  if (!sourceCode.trim()) {
    return (
      <div className="h-full flex items-center justify-center bg-black/50">
        <p className="text-muted-foreground">Enter code to see preview</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-black/90 p-4 overflow-auto">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive mb-2">Compilation Error</h3>
          <pre className="text-sm text-destructive/80 whitespace-pre-wrap font-mono">{error}</pre>
        </div>
      </div>
    );
  }

  if (!CompiledComponent) {
    return (
      <div className="h-full flex items-center justify-center bg-black/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Preview container */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          className="w-full max-w-full rounded-lg overflow-hidden shadow-2xl"
          style={{ aspectRatio: `${aspectRatio}`, maxHeight: '100%' }}
        >
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
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-border/20 text-sm text-muted-foreground">
        <span>{width}x{height}</span>
        <span>|</span>
        <span>{fps} fps</span>
        <span>|</span>
        <span>{durationInFrames} frames</span>
        <span>|</span>
        <span>{(durationInFrames / fps).toFixed(1)}s</span>
      </div>
    </div>
  );
}

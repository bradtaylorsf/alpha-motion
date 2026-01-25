import { useState } from 'react';
import { cn } from '../../lib/utils';

interface CodeViewerProps {
  code: string;
  loading?: boolean;
}

export function CodeViewer({ code, loading }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          'absolute top-4 right-4 z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          copied
            ? 'bg-green-500/20 text-green-400'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        )}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>

      {/* Code display */}
      <pre className="overflow-auto bg-[#1e1e1e] p-6 text-sm">
        <code className="text-[#d4d4d4] font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

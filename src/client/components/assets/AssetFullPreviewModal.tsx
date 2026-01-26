import { useEffect } from 'react';
import type { Asset } from '../../types';

interface AssetFullPreviewModalProps {
  asset: Asset;
  onClose: () => void;
}

export function AssetFullPreviewModal({ asset, onClose }: AssetFullPreviewModalProps) {
  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const metadata = asset.metadata as Record<string, unknown> | null;
  const isTransparent = metadata?.transparent === true;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image container */}
        <div className="relative overflow-hidden rounded-lg border border-border shadow-2xl">
          {/* Checkerboard pattern for transparent images */}
          {isTransparent && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            />
          )}
          <img
            src={asset.filePath}
            alt={asset.name}
            className="relative max-w-[90vw] max-h-[80vh] object-contain"
          />
        </div>

        {/* Asset info */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-foreground">{asset.name}</h3>
          {asset.promptUsed && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
              {asset.promptUsed}
            </p>
          )}
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{asset.source === 'nano-bananas' ? 'AI Generated' : 'Uploaded'}</span>
            {isTransparent && (
              <>
                <span>|</span>
                <span>Transparent PNG</span>
              </>
            )}
            <span>|</span>
            <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

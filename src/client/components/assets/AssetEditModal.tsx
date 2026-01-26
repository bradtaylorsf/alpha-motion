import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Asset } from '../../types';
import { cn } from '../../lib/utils';

interface AssetEditModalProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (editPrompt: string) => Promise<Asset | null>;
  editing: boolean;
}

export function AssetEditModal({
  asset,
  open,
  onOpenChange,
  onEdit,
  editing,
}: AssetEditModalProps) {
  const [editPrompt, setEditPrompt] = useState('');
  const [editedAsset, setEditedAsset] = useState<Asset | null>(null);

  const handleEdit = async () => {
    if (!editPrompt.trim() || editing) return;
    const result = await onEdit(editPrompt.trim());
    if (result) {
      setEditedAsset(result);
    }
  };

  const handleClose = () => {
    setEditPrompt('');
    setEditedAsset(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Edit Image
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Describe the changes you want to make to this image.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            {/* Image comparison */}
            <div className={cn(
              'grid gap-4',
              editedAsset ? 'grid-cols-2' : 'grid-cols-1'
            )}>
              {/* Original image */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Original
                </label>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={asset.filePath}
                    alt={asset.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {asset.promptUsed && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-medium">Original prompt:</span> {asset.promptUsed}
                  </p>
                )}
              </div>

              {/* Edited image (shown after edit completes) */}
              {editedAsset && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Edited
                  </label>
                  <div className="relative aspect-video overflow-hidden rounded-lg border border-primary bg-muted">
                    <img
                      src={editedAsset.filePath}
                      alt={editedAsset.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-medium">Edit prompt:</span> {editedAsset.promptUsed}
                  </p>
                </div>
              )}
            </div>

            {/* Edit prompt input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Edit Instructions
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe the changes, e.g., 'Make it darker', 'Add a sunset sky', 'Change the color to blue'..."
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                disabled={editing}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                onClick={handleClose}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {editedAsset ? 'Done' : 'Cancel'}
              </button>
            </Dialog.Close>
            <button
              onClick={handleEdit}
              disabled={!editPrompt.trim() || editing}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Editing...
                </span>
              ) : (
                'Apply Edit'
              )}
            </button>
          </div>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

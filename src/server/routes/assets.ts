import { Router } from 'express';
import {
  generateImage,
  editImage,
  generateTransparentImage,
  removeBackground,
  type GenerateImageOptions,
  type EditImageOptions,
} from '../services/nano-bananas';
import {
  createAsset,
  getAsset,
  getAllAssets,
  getAssetsByComponent,
  getUnlinkedAssets,
  updateAsset,
  deleteAsset,
  linkAssetToComponent,
} from '../services/asset-store';

const router = Router();

// Parse asset for response (parse JSON fields)
function parseAsset(asset: ReturnType<typeof getAsset> extends Promise<infer T> ? T : never) {
  if (!asset) return null;
  return {
    ...asset,
    metadata: asset.metadata ? JSON.parse(asset.metadata) : null,
  };
}

// Generate a single image
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model, aspectRatio, componentId, name, transparent } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    let result;

    if (transparent) {
      // Use transparent image generation (3 API calls)
      result = await generateTransparentImage({
        prompt,
        model,
        aspectRatio,
      });
    } else {
      // Standard image generation
      const options: GenerateImageOptions = {
        prompt,
        model,
        aspectRatio,
      };
      result = await generateImage(options);
    }

    // Store in database
    const asset = await createAsset({
      name: name || prompt.slice(0, 50),
      componentId,
      type: 'generated',
      source: 'nano-bananas',
      filePath: result.filePath,
      promptUsed: prompt,
      metadata: {
        model: model || 'gemini-2.0-flash-exp-image-generation',
        aspectRatio: aspectRatio || '16:9',
        transparent: transparent || false,
      },
    });

    res.json({ asset: parseAsset(asset) });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generate multiple images in batch
router.post('/generate/batch', async (req, res) => {
  try {
    const { prompts, componentId, model, aspectRatio } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'prompts array is required' });
    }

    if (prompts.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 prompts per batch' });
    }

    const results = [];
    const errors = [];

    // Generate images sequentially to avoid rate limits
    for (const prompt of prompts) {
      try {
        const options: GenerateImageOptions = {
          prompt,
          model,
          aspectRatio,
        };

        const result = await generateImage(options);

        const asset = await createAsset({
          name: prompt.slice(0, 50),
          componentId,
          type: 'generated',
          source: 'nano-bananas',
          filePath: result.filePath,
          promptUsed: prompt,
          metadata: {
            model: model || 'gemini-2.0-flash-exp-image-generation',
            aspectRatio: aspectRatio || '16:9',
          },
        });

        results.push(parseAsset(asset));
      } catch (error) {
        errors.push({
          prompt,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      assets: results,
      errors: errors.length > 0 ? errors : undefined,
      total: prompts.length,
      succeeded: results.length,
      failed: errors.length,
    });
  } catch (error) {
    console.error('Error in batch generation:', error);
    res.status(500).json({
      error: 'Failed to generate images',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List all assets (with optional componentId filter)
router.get('/', async (req, res) => {
  try {
    const { componentId, unlinked } = req.query;

    let assets;
    if (unlinked === 'true') {
      assets = await getUnlinkedAssets();
    } else if (componentId && typeof componentId === 'string') {
      assets = await getAssetsByComponent(componentId);
    } else {
      assets = await getAllAssets();
    }

    res.json({ assets: assets.map(parseAsset) });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      error: 'Failed to fetch assets',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get single asset
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await getAsset(id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(parseAsset(asset));
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      error: 'Failed to fetch asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update asset (name or link to component)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, componentId } = req.body;

    const asset = await updateAsset(id, { name, componentId });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(parseAsset(asset));
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      error: 'Failed to update asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Link asset to component (convenience endpoint)
router.put('/:id/link', async (req, res) => {
  try {
    const { id } = req.params;
    const { componentId } = req.body;

    const asset = await linkAssetToComponent(id, componentId ?? null);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(parseAsset(asset));
  } catch (error) {
    console.error('Error linking asset:', error);
    res.status(500).json({
      error: 'Failed to link asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Edit an existing image using AI
router.post('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { editPrompt, model, aspectRatio } = req.body;

    if (!editPrompt || typeof editPrompt !== 'string') {
      return res.status(400).json({ error: 'editPrompt is required' });
    }

    // Fetch original asset
    const originalAsset = await getAsset(id);
    if (!originalAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const editOptions: EditImageOptions = {
      sourceImagePath: originalAsset.filePath,
      editPrompt,
      model,
      aspectRatio,
    };

    // Edit the image
    const result = await editImage(editOptions);

    // Parse original metadata
    const originalMetadata = originalAsset.metadata ? JSON.parse(originalAsset.metadata) : {};

    // Store as NEW asset with editedFrom metadata
    const newAsset = await createAsset({
      name: `Edited: ${originalAsset.name}`.slice(0, 50),
      componentId: originalAsset.componentId ?? undefined,
      type: 'generated',
      source: 'nano-bananas',
      filePath: result.filePath,
      promptUsed: editPrompt,
      metadata: {
        model: model || 'gemini-2.0-flash-exp-image-generation',
        aspectRatio: aspectRatio || originalMetadata.aspectRatio || '16:9',
        editedFrom: id,
        originalPrompt: originalAsset.promptUsed,
      },
    });

    res.json({ asset: parseAsset(newAsset) });
  } catch (error) {
    console.error('Error editing image:', error);
    res.status(500).json({
      error: 'Failed to edit image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Remove background from an existing image
router.post('/:id/remove-background', async (req, res) => {
  try {
    const { id } = req.params;
    const { model, aspectRatio } = req.body;

    // Fetch original asset
    const originalAsset = await getAsset(id);
    if (!originalAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Parse original metadata
    const originalMetadata = originalAsset.metadata ? JSON.parse(originalAsset.metadata) : {};

    // Check if already transparent
    if (originalMetadata.transparent) {
      return res.status(400).json({ error: 'Asset already has transparent background' });
    }

    // Remove the background
    const result = await removeBackground(
      originalAsset.filePath,
      originalAsset.promptUsed || 'Unknown',
      {
        model,
        aspectRatio: aspectRatio || originalMetadata.aspectRatio,
      }
    );

    // Store as NEW asset with backgroundRemoved metadata
    const newAsset = await createAsset({
      name: `${originalAsset.name} (transparent)`.slice(0, 50),
      componentId: originalAsset.componentId ?? undefined,
      type: 'generated',
      source: 'nano-bananas',
      filePath: result.filePath,
      promptUsed: originalAsset.promptUsed ?? undefined,
      metadata: {
        model: model || originalMetadata.model || 'gemini-2.0-flash-exp-image-generation',
        aspectRatio: aspectRatio || originalMetadata.aspectRatio || '16:9',
        transparent: true,
        backgroundRemovedFrom: id,
      },
    });

    res.json({ asset: parseAsset(newAsset) });
  } catch (error) {
    console.error('Error removing background:', error);
    res.status(500).json({
      error: 'Failed to remove background',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete asset (removes file and database record)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteAsset(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      error: 'Failed to delete asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

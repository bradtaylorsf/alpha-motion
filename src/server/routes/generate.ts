import { Router } from 'express';
import { startGeneration, getJobStatus, startEditGeneration, getEditJobStatus } from '../services/claude-code';
import { createComponent, getComponent, updateComponent } from '../services/component-store';
import { linkAssetToComponent, getAssetsByComponent } from '../services/asset-store';
import type { AnimationIdea } from '../services/anthropic';

const router = Router();

export interface GenerationOptions {
  durationFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  assets?: { url: string; prompt: string; id: string }[];
}

router.post('/', async (req, res) => {
  try {
    const { idea, options } = req.body as { idea: AnimationIdea; options?: GenerationOptions };
    console.log('POST /api/generate - Received request:', idea?.title);
    if (options?.assets?.length) {
      console.log(`POST /api/generate - With ${options.assets.length} assets`);
    }

    if (!idea || !idea.title || !idea.description) {
      return res.status(400).json({ error: 'Valid idea object is required' });
    }

    const jobId = startGeneration(idea, options);
    console.log(`POST /api/generate - Started job: ${jobId}`);

    res.json({
      jobId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Error starting generation:', error);
    res.status(500).json({
      error: 'Failed to start generation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const response: {
      jobId: string;
      status: string;
      error?: string;
      component?: object;
    } = {
      jobId: job.id,
      status: job.status,
    };

    if (job.status === 'failed') {
      response.error = job.error;
    }

    if (job.status === 'complete' && job.result) {
      // Save the component to database with options if provided
      const component = await createComponent({
        name: job.idea.title,
        description: job.idea.description,
        promptUsed: job.idea.detailedPrompt || `${job.idea.title}: ${job.idea.description}`,
        idea: job.idea,
        sourceCode: job.result,
        tags: [
          job.idea.style,
          job.idea.motion,
          ...job.idea.elements.slice(0, 3),
        ].filter(Boolean),
        durationFrames: job.options?.durationFrames,
        fps: job.options?.fps,
        width: job.options?.width,
        height: job.options?.height,
      });

      // Link any assets to this component
      if (job.options?.assets?.length) {
        for (const asset of job.options.assets) {
          if (asset.id) {
            await linkAssetToComponent(asset.id, component.id);
          }
        }
        console.log(`Linked ${job.options.assets.length} assets to component ${component.id}`);
      }

      // Parse JSON fields before returning (they're stored as strings in DB)
      response.component = {
        ...component,
        tags: component.tags ? JSON.parse(component.tags) : [],
        ideaJson: component.ideaJson ? JSON.parse(component.ideaJson) : null,
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Edit an existing component
router.post('/edit', async (req, res) => {
  try {
    const { componentId, instructions } = req.body as { componentId: string; instructions: string };
    console.log(`POST /api/generate/edit - Component: ${componentId}`);

    if (!componentId || !instructions) {
      return res.status(400).json({ error: 'componentId and instructions are required' });
    }

    // Get the current component
    const component = await getComponent(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (!component.sourceCode) {
      return res.status(400).json({ error: 'Component has no source code to edit' });
    }

    // Get linked assets
    const assets = await getAssetsByComponent(componentId);
    const assetInfos = assets
      .filter(a => a.filePath)
      .map(a => ({
        id: a.id,
        url: `/uploads/${a.filePath!.split('/').pop()}`,
        prompt: a.promptUsed || a.name,
        type: undefined,
      }));

    const jobId = startEditGeneration(
      componentId,
      component.sourceCode,
      instructions,
      'edit',
      assetInfos
    );
    console.log(`POST /api/generate/edit - Started job: ${jobId}`);

    res.json({
      jobId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Error starting edit generation:', error);
    res.status(500).json({
      error: 'Failed to start edit generation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Remix (create new component based on existing one)
router.post('/remix', async (req, res) => {
  try {
    const { componentId, instructions } = req.body as { componentId: string; instructions: string };
    console.log(`POST /api/generate/remix - Component: ${componentId}`);

    if (!componentId || !instructions) {
      return res.status(400).json({ error: 'componentId and instructions are required' });
    }

    // Get the current component
    const component = await getComponent(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (!component.sourceCode) {
      return res.status(400).json({ error: 'Component has no source code to remix' });
    }

    // Get linked assets
    const assets = await getAssetsByComponent(componentId);
    const assetInfos = assets
      .filter(a => a.filePath)
      .map(a => ({
        id: a.id,
        url: `/uploads/${a.filePath!.split('/').pop()}`,
        prompt: a.promptUsed || a.name,
        type: undefined,
      }));

    const jobId = startEditGeneration(
      componentId,
      component.sourceCode,
      instructions,
      'remix',
      assetInfos
    );
    console.log(`POST /api/generate/remix - Started job: ${jobId}`);

    res.json({
      jobId,
      status: 'queued',
    });
  } catch (error) {
    console.error('Error starting remix generation:', error);
    res.status(500).json({
      error: 'Failed to start remix generation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get edit/remix job status
router.get('/edit/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getEditJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const response: {
      jobId: string;
      status: string;
      type: 'edit' | 'remix';
      error?: string;
      component?: object;
    } = {
      jobId: job.id,
      status: job.status,
      type: job.type,
    };

    if (job.status === 'failed') {
      response.error = job.error;
    }

    if (job.status === 'complete' && job.result) {
      if (job.type === 'edit') {
        // Update existing component
        const updated = await updateComponent(job.componentId, {
          sourceCode: job.result,
        });
        if (updated) {
          // Parse JSON fields
          response.component = {
            ...updated,
            tags: updated.tags ? JSON.parse(updated.tags) : [],
            ideaJson: updated.ideaJson ? JSON.parse(updated.ideaJson) : null,
          };
        }
      } else {
        // Create new component as remix
        const original = await getComponent(job.componentId);
        if (original) {
          const newComponent = await createComponent({
            name: `${original.name} (Remix)`,
            description: original.description || undefined,
            promptUsed: `Remix: ${job.instructions}`,
            idea: original.ideaJson ? JSON.parse(original.ideaJson) : undefined,
            sourceCode: job.result,
            tags: original.tags ? JSON.parse(original.tags) : undefined,
            durationFrames: original.durationFrames ?? undefined,
            fps: original.fps ?? undefined,
            width: original.width ?? undefined,
            height: original.height ?? undefined,
          });
          // Parse JSON fields
          response.component = {
            ...newComponent,
            tags: newComponent.tags ? JSON.parse(newComponent.tags) : [],
            ideaJson: newComponent.ideaJson ? JSON.parse(newComponent.ideaJson) : null,
          };
        }
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting edit job status:', error);
    res.status(500).json({
      error: 'Failed to get edit job status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

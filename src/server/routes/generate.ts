import { Router } from 'express';
import { startGeneration, getJobStatus } from '../services/claude-code';
import { createComponent } from '../services/component-store';
import { linkAssetToComponent } from '../services/asset-store';
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
        promptUsed: `${job.idea.title}: ${job.idea.description}`,
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

export default router;

import { Router } from 'express';
import { startRender, getRenderStatus } from '../services/render';
import { getComponent } from '../services/component-store';
import type { ExportOptions, VideoCodec } from '../../shared/codec-config';
import { CODEC_CONFIGS, isValidCrf, isValidAudioCodec, PRORES_PROFILES } from '../../shared/codec-config';

const router = Router();

interface StartRenderBody {
  componentId: string;
  options: {
    codec: VideoCodec;
    crf?: number;
    audioCodec?: string;
    proresProfile?: string;
  };
}

router.post('/', async (req, res) => {
  try {
    const { componentId, options } = req.body as StartRenderBody;

    if (!componentId) {
      return res.status(400).json({ error: 'componentId is required' });
    }

    if (!options?.codec) {
      return res.status(400).json({ error: 'options.codec is required' });
    }

    // Validate codec
    if (!CODEC_CONFIGS[options.codec]) {
      return res.status(400).json({ error: `Invalid codec: ${options.codec}` });
    }

    // Validate CRF if provided
    if (options.crf !== undefined && options.codec !== 'prores') {
      if (!isValidCrf(options.codec, options.crf)) {
        const config = CODEC_CONFIGS[options.codec];
        return res.status(400).json({
          error: `Invalid CRF ${options.crf} for codec ${options.codec}. Range: ${config.crfRange?.min}-${config.crfRange?.max}`,
        });
      }
    }

    // Validate audio codec if provided
    if (options.audioCodec && !isValidAudioCodec(options.codec, options.audioCodec as any)) {
      return res.status(400).json({
        error: `Invalid audio codec ${options.audioCodec} for ${options.codec}`,
      });
    }

    // Validate ProRes profile if provided
    if (options.proresProfile && options.codec === 'prores') {
      if (!PRORES_PROFILES.includes(options.proresProfile as any)) {
        return res.status(400).json({
          error: `Invalid ProRes profile: ${options.proresProfile}`,
        });
      }
    }

    // Fetch component
    const component = await getComponent(componentId);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    if (!component.sourceCode) {
      return res.status(400).json({ error: 'Component has no source code' });
    }

    // Prepare video config
    const videoConfig = {
      width: component.width,
      height: component.height,
      fps: component.fps,
      durationInFrames: component.durationFrames,
    };

    // Prepare export options
    const exportOptions: ExportOptions = {
      codec: options.codec,
      crf: options.crf,
      audioCodec: options.audioCodec as any,
      proresProfile: options.proresProfile as any,
    };

    // Start render
    const jobId = startRender(componentId, component.sourceCode, videoConfig, exportOptions);

    res.json({ jobId });
  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({
      error: 'Failed to start render',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = getRenderStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Render job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching render status:', error);
    res.status(500).json({
      error: 'Failed to fetch render status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

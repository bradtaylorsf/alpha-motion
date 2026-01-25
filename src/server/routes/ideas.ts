import { Router } from 'express';
import { generateRandomIdea, expandIdea } from '../services/anthropic';

const router = Router();

router.post('/random', async (req, res) => {
  try {
    const { category } = req.body;
    const idea = await generateRandomIdea(category);
    res.json({ idea });
  } catch (error) {
    console.error('Error generating random idea:', error);
    res.status(500).json({
      error: 'Failed to generate idea',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/expand', async (req, res) => {
  try {
    const { userIdea } = req.body;

    if (!userIdea || typeof userIdea !== 'string') {
      return res.status(400).json({ error: 'userIdea is required and must be a string' });
    }

    const idea = await expandIdea(userIdea);
    res.json({ idea });
  } catch (error) {
    console.error('Error expanding idea:', error);
    res.status(500).json({
      error: 'Failed to expand idea',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

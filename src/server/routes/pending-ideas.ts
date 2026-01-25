import { Router } from 'express';
import {
  createPendingIdea,
  getPendingIdea,
  getAllPendingIdeas,
  updatePendingIdea,
  addAssetToPendingIdea,
  removeAssetFromPendingIdea,
  deletePendingIdea,
} from '../services/pending-ideas-store';

const router = Router();

// Create a new pending idea
router.post('/', async (req, res) => {
  try {
    const { idea, settings, assetIds } = req.body;

    if (!idea || !settings) {
      return res.status(400).json({ error: 'idea and settings are required' });
    }

    const pending = await createPendingIdea({ idea, settings, assetIds });
    res.json({ pendingIdea: pending });
  } catch (error) {
    console.error('Error creating pending idea:', error);
    res.status(500).json({
      error: 'Failed to create pending idea',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all pending ideas
router.get('/', async (_req, res) => {
  try {
    const pendingIdeas = await getAllPendingIdeas();
    res.json({ pendingIdeas });
  } catch (error) {
    console.error('Error fetching pending ideas:', error);
    res.status(500).json({
      error: 'Failed to fetch pending ideas',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get a single pending idea
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pending = await getPendingIdea(id);

    if (!pending) {
      return res.status(404).json({ error: 'Pending idea not found' });
    }

    res.json(pending);
  } catch (error) {
    console.error('Error fetching pending idea:', error);
    res.status(500).json({
      error: 'Failed to fetch pending idea',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update a pending idea
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { idea, settings, assetIds } = req.body;

    const pending = await updatePendingIdea(id, { idea, settings, assetIds });

    if (!pending) {
      return res.status(404).json({ error: 'Pending idea not found' });
    }

    res.json(pending);
  } catch (error) {
    console.error('Error updating pending idea:', error);
    res.status(500).json({
      error: 'Failed to update pending idea',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Add asset to pending idea
router.post('/:id/assets', async (req, res) => {
  try {
    const { id } = req.params;
    const { assetId } = req.body;

    if (!assetId) {
      return res.status(400).json({ error: 'assetId is required' });
    }

    const pending = await addAssetToPendingIdea(id, assetId);

    if (!pending) {
      return res.status(404).json({ error: 'Pending idea not found' });
    }

    res.json(pending);
  } catch (error) {
    console.error('Error adding asset to pending idea:', error);
    res.status(500).json({
      error: 'Failed to add asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Remove asset from pending idea
router.delete('/:id/assets/:assetId', async (req, res) => {
  try {
    const { id, assetId } = req.params;

    const pending = await removeAssetFromPendingIdea(id, assetId);

    if (!pending) {
      return res.status(404).json({ error: 'Pending idea not found' });
    }

    res.json(pending);
  } catch (error) {
    console.error('Error removing asset from pending idea:', error);
    res.status(500).json({
      error: 'Failed to remove asset',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete a pending idea
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deletePendingIdea(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Pending idea not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pending idea:', error);
    res.status(500).json({
      error: 'Failed to delete pending idea',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

import { Router } from 'express';
import {
  getAllComponents,
  getComponent,
  updateComponent,
  deleteComponent,
  getComponentsByTags,
} from '../services/component-store';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { tags } = req.query;

    let components;
    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map((t) => t.trim());
      components = await getComponentsByTags(tagList);
    } else {
      components = await getAllComponents();
    }

    // Parse tags JSON for each component
    const parsed = components.map((c) => ({
      ...c,
      tags: c.tags ? JSON.parse(c.tags) : [],
      ideaJson: c.ideaJson ? JSON.parse(c.ideaJson) : null,
    }));

    res.json({ components: parsed });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({
      error: 'Failed to fetch components',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await getComponent(id);

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json({
      ...component,
      tags: component.tags ? JSON.parse(component.tags) : [],
      ideaJson: component.ideaJson ? JSON.parse(component.ideaJson) : null,
    });
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({
      error: 'Failed to fetch component',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/source', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await getComponent(id);

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.type('text/plain').send(component.sourceCode);
  } catch (error) {
    console.error('Error fetching component source:', error);
    res.status(500).json({
      error: 'Failed to fetch component source',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const component = await updateComponent(id, updates);

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json({
      ...component,
      tags: component.tags ? JSON.parse(component.tags) : [],
      ideaJson: component.ideaJson ? JSON.parse(component.ideaJson) : null,
    });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({
      error: 'Failed to update component',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteComponent(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Component not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({
      error: 'Failed to delete component',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

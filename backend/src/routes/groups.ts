import express, { Request, Response } from 'express';
import { getDb } from '../models/database';
import { attachUserInfo } from '../middleware/auth';

const router = express.Router();
const db = getDb();

// Apply user info middleware
router.use(attachUserInfo);

// Get all groups for the authenticated user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const groups = db.prepare(`
      SELECT g.*, COUNT(t.id) as task_count 
      FROM groups g 
      LEFT JOIN tasks t ON g.id = t.group_id 
      WHERE g.user_id = ? 
      GROUP BY g.id 
      ORDER BY g.created_at DESC
    `).all(userId);

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get a specific group
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const groupId = parseInt(req.params.id);

    const group = db.prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId) as any;

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get tasks in this group
    const tasks = db.prepare('SELECT * FROM tasks WHERE group_id = ? AND user_id = ? ORDER BY created_at DESC').all(groupId, userId);
    group.tasks = tasks;

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create a new group
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, color } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = db.prepare('INSERT INTO groups (user_id, name, color) VALUES (?, ?, ?)').run(
      userId,
      name,
      color || null
    );

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid) as any;
    group.task_count = 0;

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update a group
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const groupId = parseInt(req.params.id);
    const { name, color } = req.body;

    // Check if group exists and belongs to user
    const existingGroup = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(groupId, userId);
    if (!existingGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      if (name.trim() === '') {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.push('name = ?');
      params.push(name);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (updates.length === 0) {
      const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as any;
      return res.json(group);
    }

    params.push(groupId, userId);

    db.prepare(`UPDATE groups SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as any;
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE group_id = ?').get(groupId) as { count: number };
    group.task_count = taskCount.count;

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete a group
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const groupId = parseInt(req.params.id);

    const result = db.prepare('DELETE FROM groups WHERE id = ? AND user_id = ?').run(groupId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

export default router;


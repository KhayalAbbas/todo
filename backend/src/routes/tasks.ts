import express, { Request, Response } from 'express';
import { getDb } from '../models/database';
import { attachUserInfo } from '../middleware/auth';

const router = express.Router();
const db = getDb();

// Apply user info middleware
router.use(attachUserInfo);

// Get all tasks for the authenticated user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { group_id, completed } = req.query;

    let query = 'SELECT t.*, g.name as group_name, g.color as group_color FROM tasks t LEFT JOIN groups g ON t.group_id = g.id WHERE t.user_id = ?';
    const params: any[] = [userId];

    if (group_id) {
      query += ' AND t.group_id = ?';
      params.push(group_id);
    }

    if (completed !== undefined) {
      query += ' AND t.completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }

    query += ' ORDER BY t.created_at DESC';

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a specific task
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);

    const task = db.prepare(`
      SELECT t.*, g.name as group_name, g.color as group_color 
      FROM tasks t 
      LEFT JOIN groups g ON t.group_id = g.id 
      WHERE t.id = ? AND t.user_id = ?
    `).get(taskId, userId) as any;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, description, deadline, group_id } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate group_id belongs to user if provided
    if (group_id) {
      const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(group_id, userId);
      if (!group) {
        return res.status(400).json({ error: 'Invalid group' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (user_id, group_id, title, description, deadline, completed)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(userId, group_id || null, title, description || null, deadline || null);

    const task = db.prepare(`
      SELECT t.*, g.name as group_name, g.color as group_color 
      FROM tasks t 
      LEFT JOIN groups g ON t.group_id = g.id 
      WHERE t.id = ?
    `).get(result.lastInsertRowid) as any;

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);
    const { title, description, deadline, group_id, completed } = req.body;

    // Check if task exists and belongs to user
    const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate group_id if provided
    if (group_id !== undefined) {
      if (group_id === null) {
        // Allow setting group to null
      } else {
        const group = db.prepare('SELECT id FROM groups WHERE id = ? AND user_id = ?').get(group_id, userId);
        if (!group) {
          return res.status(400).json({ error: 'Invalid group' });
        }
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.push('title = ?');
      params.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (deadline !== undefined) {
      updates.push('deadline = ?');
      params.push(deadline);
    }

    if (group_id !== undefined) {
      updates.push('group_id = ?');
      params.push(group_id);
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(taskId, userId);

    db.prepare(`
      UPDATE tasks 
      SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ?
    `).run(...params);

    const task = db.prepare(`
      SELECT t.*, g.name as group_name, g.color as group_color 
      FROM tasks t 
      LEFT JOIN groups g ON t.group_id = g.id 
      WHERE t.id = ?
    `).get(taskId) as any;

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);

    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Toggle task completion
router.patch('/:id/complete', (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const taskId = parseInt(req.params.id);
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be a boolean' });
    }

    const result = db.prepare(`
      UPDATE tasks 
      SET completed = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(completed ? 1 : 0, taskId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = db.prepare(`
      SELECT t.*, g.name as group_name, g.color as group_color 
      FROM tasks t 
      LEFT JOIN groups g ON t.group_id = g.id 
      WHERE t.id = ?
    `).get(taskId) as any;

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;


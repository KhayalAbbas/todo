import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDb } from '../src/models/database';
import taskRoutes from '../src/routes/tasks';
import groupRoutes from '../src/routes/groups';
import { authMiddleware } from '../src/middleware/auth';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', authMiddleware);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);

// Test credentials
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpass123';

describe('Tasks API', () => {
  let authHeader: string;
  let userId: number;
  let testGroupId: number;

  beforeAll(() => {
    // Initialize test database
    initializeDatabase();
    const db = getDb();

    // Create test user
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(TEST_USERNAME, passwordHash);
    userId = Number(result.lastInsertRowid);

    // Create test group
    const groupResult = db.prepare('INSERT INTO groups (user_id, name, color) VALUES (?, ?, ?)').run(userId, 'Test Group', '#FF0000');
    testGroupId = Number(groupResult.lastInsertRowid);

    // Create auth header
    const credentials = Buffer.from(`${TEST_USERNAME}:${TEST_PASSWORD}`).toString('base64');
    authHeader = `Basic ${credentials}`;
  });

  afterAll(() => {
    const db = getDb();
    // Clean up test data
    db.prepare('DELETE FROM tasks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM groups WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', authHeader)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          deadline: '2024-12-31T23:59:59Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
      expect(response.body.description).toBe('This is a test task');
      expect(response.body.completed).toBe(0);
    });

    it('should create a task with a group', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', authHeader)
        .send({
          title: 'Grouped Task',
          group_id: testGroupId,
        });

      expect(response.status).toBe(201);
      expect(response.body.group_id).toBe(testGroupId);
      expect(response.body.group_name).toBe('Test Group');
    });

    it('should reject task without title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', authHeader)
        .send({
          description: 'No title',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks for the user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter tasks by completed status', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=false')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      response.body.forEach((task: any) => {
        expect(task.completed).toBe(0);
      });
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    it('should mark a task as complete', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', authHeader)
        .send({ title: 'Task to complete' });

      const taskId = createResponse.body.id;

      // Mark as complete
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', authHeader)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(1);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      // Create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', authHeader)
        .send({ title: 'Original Title' });

      const taskId = createResponse.body.id;

      // Update the task
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', authHeader)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      // Create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', authHeader)
        .send({ title: 'Task to delete' });

      const taskId = createResponse.body.id;

      // Delete the task
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', authHeader);

      expect(getResponse.status).toBe(404);
    });
  });
});


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
const TEST_USERNAME = 'testuser2';
const TEST_PASSWORD = 'testpass123';

describe('Groups API', () => {
  let authHeader: string;
  let userId: number;

  beforeAll(() => {
    // Initialize test database
    initializeDatabase();
    const db = getDb();

    // Create test user
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(TEST_USERNAME, passwordHash);
    userId = Number(result.lastInsertRowid);

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

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', authHeader)
        .send({
          name: 'Test Group',
          color: '#FF0000',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Group');
      expect(response.body.color).toBe('#FF0000');
    });

    it('should reject group without name', async () => {
      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', authHeader)
        .send({
          color: '#FF0000',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name is required');
    });
  });

  describe('GET /api/groups', () => {
    it('should get all groups for the user', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update a group', async () => {
      // Create a group
      const createResponse = await request(app)
        .post('/api/groups')
        .set('Authorization', authHeader)
        .send({ name: 'Original Name' });

      const groupId = createResponse.body.id;

      // Update the group
      const response = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', authHeader)
        .send({
          name: 'Updated Name',
          color: '#00FF00',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.color).toBe('#00FF00');
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete a group', async () => {
      // Create a group
      const createResponse = await request(app)
        .post('/api/groups')
        .set('Authorization', authHeader)
        .send({ name: 'Group to delete' });

      const groupId = createResponse.body.id;

      // Delete the group
      const response = await request(app)
        .delete(`/api/groups/${groupId}`)
        .set('Authorization', authHeader);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/groups/${groupId}`)
        .set('Authorization', authHeader);

      expect(getResponse.status).toBe(404);
    });
  });
});


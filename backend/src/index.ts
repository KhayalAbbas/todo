import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './models/database';
import taskRoutes from './routes/tasks';
import groupRoutes from './routes/groups';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Apply authentication to all API routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


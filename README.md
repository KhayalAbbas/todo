# TODO Application

A full-stack TODO application built with Node.js, TypeScript, React, and SQLite.

## Features

- ✅ Create, read, update, and delete tasks
- ✅ Set deadlines for tasks
- ✅ Mark tasks as complete
- ✅ Group tasks into categories
- ✅ HTTP Basic Authentication
- ✅ PWA support with offline functionality
- ✅ Client-side caching

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **SQLite** database (easily migratable to PostgreSQL)
- **HTTP Basic Auth** for authentication
- **Jest** for testing

### Frontend
- **React** with **TypeScript**
- **Vite** for build tooling
- **Service Worker** for PWA functionality
- **Local Storage** for offline caching

## Project Structure

```
YeaTask/
├── backend/          # Node.js/TypeScript backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── models/   # Database models
│   │   ├── middleware/ # Auth middleware
│   │   └── utils/    # Utilities
│   ├── tests/        # Backend tests
│   └── package.json
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/ # API services
│   │   └── utils/    # Utilities
│   └── package.json
└── README.md
```

## Design Choices

### Backend Architecture

1. **Database Choice**: SQLite was chosen for simplicity and zero-configuration setup. The code is structured to easily migrate to PostgreSQL if needed. A JSON database fallback is included for environments where native SQLite compilation isn't available (e.g., Windows without build tools).

2. **Authentication**: HTTP Basic Auth was implemented as requested. While not the most secure, it's simple and sufficient for this use case. The credentials are hashed using bcryptjs (pure JavaScript implementation for cross-platform compatibility).

3. **API Design**: RESTful API design with clear separation of concerns:
   - Routes handle HTTP requests
   - Models handle database operations
   - Middleware handles authentication

4. **Security Considerations**:
   - Password hashing with bcryptjs
   - SQL injection prevention using parameterized queries
   - CORS configuration
   - Input validation
   - User isolation (users can only access their own data)

5. **Performance**:
   - Database indexes on frequently queried fields
   - Efficient queries with proper joins
   - Connection pooling ready (for PostgreSQL migration)

### Frontend Architecture

1. **State Management**: React hooks (useState, useEffect) for local state. For a larger app, Redux or Zustand would be considered.

2. **PWA Features**:
   - Service Worker for offline support
   - Cache API for API responses
   - Local Storage for task persistence

3. **User Experience**:
   - Optimistic UI updates
   - Loading states
   - Error handling with user feedback

4. **Code Organization**:
   - Component-based architecture
   - Separation of API logic from UI components
   - Reusable utility functions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3000`

2. In a new terminal, start the frontend development server:
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

### Default Credentials

- Username: `admin`
- Password: `admin123`

**Note**: Change these in production! The default user is automatically created on first run.

### Running Tests

```bash
cd backend
npm test
```

## API Endpoints

### Authentication
All endpoints require HTTP Basic Authentication.

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/complete` - Mark task as complete/incomplete

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group

## Future Improvements

If given more time, I would implement:

1. **Enhanced Security**:
   - JWT tokens instead of Basic Auth
   - Rate limiting
   - Input sanitization library

2. **Advanced Features**:
   - Task priorities
   - Task tags
   - Task search and filtering
   - Task sorting options
   - Recurring tasks
   - Task attachments

3. **Performance**:
   - Redis caching layer
   - Database query optimization
   - Pagination for large task lists

4. **Testing**:
   - Frontend unit tests
   - Integration tests
   - E2E tests with Playwright

5. **DevOps**:
   - Docker containerization
   - CI/CD pipeline
   - Environment-specific configurations

## License

MIT


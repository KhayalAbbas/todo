import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

interface Group {
  id: number;
  user_id: number;
  name: string;
  color?: string;
  created_at: string;
}

interface Task {
  id: number;
  user_id: number;
  group_id?: number;
  title: string;
  description?: string;
  deadline?: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

interface Database {
  users: User[];
  groups: Group[];
  tasks: Task[];
}

const dbPath = path.join(__dirname, '../../data/db.json');

let db: Database = {
  users: [],
  groups: [],
  tasks: [],
};

const loadDatabase = () => {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
};

const saveDatabase = () => {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Initialize database on load
loadDatabase();

export const initializeDatabase = () => {
  // Create default admin user if it doesn't exist
  const existingUser = db.users.find((u) => u.username === 'admin');
  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    const newUser: User = {
      id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
      username: 'admin',
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDatabase();
    console.log('Default admin user created (username: admin, password: admin123)');
  }
};

// Database operations
export const getDb = () => {
  return {
    prepare: (query: string) => {
      const stmt = query.trim().toUpperCase();
      
      // SELECT queries
      if (stmt.startsWith('SELECT')) {
        return {
          get: (...params: any[]) => {
            if (query.includes('FROM users WHERE username = ?')) {
              return db.users.find((u) => u.username === params[0]);
            }
            if (query.includes('FROM users WHERE id = ?')) {
              return db.users.find((u) => u.id === params[0]);
            }
            if (query.includes('FROM groups WHERE id = ?') && query.includes('user_id = ?')) {
              return db.groups.find((g) => g.id === params[0] && g.user_id === params[1]);
            }
            if (query.includes('FROM groups WHERE id = ?')) {
              return db.groups.find((g) => g.id === params[0]);
            }
            if (query.includes('FROM tasks WHERE id = ?') && query.includes('user_id = ?')) {
              return db.tasks.find((t) => t.id === params[0] && t.user_id === params[1]);
            }
            if (query.includes('FROM tasks WHERE id = ?')) {
              return db.tasks.find((t) => t.id === params[0]);
            }
            if (query.includes('FROM tasks WHERE group_id = ?') && query.includes('user_id = ?')) {
              return db.tasks.filter((t) => t.group_id === params[0] && t.user_id === params[1]);
            }
            if (query.includes('COUNT(*)')) {
              if (query.includes('FROM tasks WHERE group_id = ?')) {
                return { count: db.tasks.filter((t) => t.group_id === params[0]).length };
              }
            }
            return null;
          },
          all: (...params: any[]) => {
            if (query.includes('FROM tasks')) {
              let results = [...db.tasks];
              if (query.includes('WHERE t.user_id = ?')) {
                results = results.filter((t) => t.user_id === params[0]);
                if (query.includes('AND t.group_id = ?')) {
                  results = results.filter((t) => t.group_id === params[1]);
                }
                if (query.includes('AND t.completed = ?')) {
                  const completed = params[params.length - 1] === 1;
                  results = results.filter((t) => t.completed === (completed ? 1 : 0));
                }
              }
              // Join with groups
              if (query.includes('LEFT JOIN groups')) {
                return results.map((task) => {
                  const group = task.group_id
                    ? db.groups.find((g) => g.id === task.group_id)
                    : null;
                  return {
                    ...task,
                    group_name: group?.name,
                    group_color: group?.color,
                  };
                });
              }
              return results;
            }
            if (query.includes('FROM groups')) {
              let results = [...db.groups];
              if (query.includes('WHERE g.user_id = ?')) {
                results = results.filter((g) => g.user_id === params[0]);
              }
              // Join with tasks for count
              if (query.includes('LEFT JOIN tasks')) {
                return results.map((group) => {
                  const taskCount = db.tasks.filter((t) => t.group_id === group.id).length;
                  return {
                    ...group,
                    task_count: taskCount,
                  };
                });
              }
              return results;
            }
            return [];
          },
          run: (...params: any[]) => {
            // This is for INSERT/UPDATE/DELETE
            return { lastInsertRowid: 0, changes: 0 };
          },
        };
      }
      
      // INSERT queries
      if (stmt.startsWith('INSERT')) {
        return {
          run: (...params: any[]) => {
            if (query.includes('INTO users')) {
              const newUser: User = {
                id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
                username: params[0],
                password_hash: params[1],
                created_at: new Date().toISOString(),
              };
              db.users.push(newUser);
              saveDatabase();
              return { lastInsertRowid: newUser.id, changes: 1 };
            }
            if (query.includes('INTO groups')) {
              const newGroup: Group = {
                id: db.groups.length > 0 ? Math.max(...db.groups.map((g) => g.id)) + 1 : 1,
                user_id: params[0],
                name: params[1],
                color: params[2] || null,
                created_at: new Date().toISOString(),
              };
              db.groups.push(newGroup);
              saveDatabase();
              return { lastInsertRowid: newGroup.id, changes: 1 };
            }
            if (query.includes('INTO tasks')) {
              const newTask: Task = {
                id: db.tasks.length > 0 ? Math.max(...db.tasks.map((t) => t.id)) + 1 : 1,
                user_id: params[0],
                group_id: params[1] || null,
                title: params[2],
                description: params[3] || null,
                deadline: params[4] || null,
                completed: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              db.tasks.push(newTask);
              saveDatabase();
              return { lastInsertRowid: newTask.id, changes: 1 };
            }
            return { lastInsertRowid: 0, changes: 0 };
          },
        };
      }
      
      // UPDATE queries
      if (stmt.startsWith('UPDATE')) {
        return {
          run: (...params: any[]) => {
            if (query.includes('UPDATE groups')) {
              const id = params[params.length - 2];
              const userId = params[params.length - 1];
              const group = db.groups.find((g) => g.id === id && g.user_id === userId);
              if (group) {
                if (query.includes('name = ?')) {
                  group.name = params[0];
                }
                if (query.includes('color = ?')) {
                  group.color = params[params.length - 3] || null;
                }
                saveDatabase();
                return { changes: 1 };
              }
            }
            if (query.includes('UPDATE tasks')) {
              const id = params[params.length - 2];
              const userId = params[params.length - 1];
              const task = db.tasks.find((t) => t.id === id && t.user_id === userId);
              if (task) {
                let paramIndex = 0;
                if (query.includes('title = ?')) {
                  task.title = params[paramIndex++];
                }
                if (query.includes('description = ?')) {
                  task.description = params[paramIndex++];
                }
                if (query.includes('deadline = ?')) {
                  task.deadline = params[paramIndex++];
                }
                if (query.includes('group_id = ?')) {
                  task.group_id = params[paramIndex++] || null;
                }
                if (query.includes('completed = ?')) {
                  task.completed = params[paramIndex++];
                }
                task.updated_at = new Date().toISOString();
                saveDatabase();
                return { changes: 1 };
              }
            }
            return { changes: 0 };
          },
        };
      }
      
      // DELETE queries
      if (stmt.startsWith('DELETE')) {
        return {
          run: (...params: any[]) => {
            if (query.includes('FROM groups')) {
              const id = params[0];
              const userId = params[1];
              const index = db.groups.findIndex((g) => g.id === id && g.user_id === userId);
              if (index !== -1) {
                db.groups.splice(index, 1);
                // Remove group_id from tasks
                db.tasks.forEach((t) => {
                  if (t.group_id === id) {
                    t.group_id = null;
                  }
                });
                saveDatabase();
                return { changes: 1 };
              }
            }
            if (query.includes('FROM tasks')) {
              const id = params[0];
              const userId = params[1];
              const index = db.tasks.findIndex((t) => t.id === id && t.user_id === userId);
              if (index !== -1) {
                db.tasks.splice(index, 1);
                saveDatabase();
                return { changes: 1 };
              }
            }
            if (query.includes('FROM users')) {
              const id = params[0];
              const index = db.users.findIndex((u) => u.id === id);
              if (index !== -1) {
                db.users.splice(index, 1);
                // Cascade delete groups and tasks
                db.groups = db.groups.filter((g) => g.user_id !== id);
                db.tasks = db.tasks.filter((t) => t.user_id !== id);
                saveDatabase();
                return { changes: 1 };
              }
            }
            return { changes: 0 };
          },
        };
      }
      
      return {
        get: () => null,
        all: () => [],
        run: () => ({ lastInsertRowid: 0, changes: 0 }),
      };
    },
    exec: (sql: string) => {
      // For CREATE TABLE and other DDL - we don't need to do anything with JSON storage
      // Tables are created implicitly when data is inserted
    },
  };
};

export default getDb();


import { useState, useEffect } from 'react';
import Login from './components/Login';
import TaskList from './components/TaskList';
import GroupList from './components/GroupList';
import TaskForm from './components/TaskForm';
import GroupForm from './components/GroupForm';
import { getAuthCredentials, setAuthCredentials, clearAuthCredentials } from './utils/auth';
import { checkApiHealth } from './services/api';
import './App.css';

interface Task {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  completed: number;
  group_id?: number;
  group_name?: string;
  group_color?: string;
}

interface Group {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const credentials = getAuthCredentials();
      if (credentials) {
        try {
          const isHealthy = await checkApiHealth();
          if (isHealthy) {
            setIsAuthenticated(true);
            loadData();
          } else {
            clearAuthCredentials();
          }
        } catch (error) {
          clearAuthCredentials();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const loadData = async () => {
    try {
      const { fetchTasks, fetchGroups } = await import('./services/api');
      const [tasksData, groupsData] = await Promise.all([
        fetchTasks(selectedGroup || undefined, filterCompleted !== null ? filterCompleted : undefined),
        fetchGroups(),
      ]);
      setTasks(tasksData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, selectedGroup, filterCompleted]);

  const handleLogin = (username: string, password: string) => {
    setAuthCredentials(username, password);
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = () => {
    clearAuthCredentials();
    setIsAuthenticated(false);
    setTasks([]);
    setGroups([]);
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    loadData();
  };

  const handleTaskUpdated = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    loadData();
  };

  const handleTaskDeleted = () => {
    loadData();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleGroupCreated = () => {
    setShowGroupForm(false);
    loadData();
  };

  const handleGroupDeleted = () => {
    loadData();
    if (selectedGroup) {
      setSelectedGroup(null);
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>TODO Application</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h2>Groups</h2>
            <button
              onClick={() => setShowGroupForm(true)}
              className="btn btn-primary"
            >
              + New Group
            </button>
            <GroupList
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectGroup={(id) => setSelectedGroup(id === selectedGroup ? null : id)}
              onDelete={handleGroupDeleted}
            />
          </div>

          <div className="sidebar-section">
            <h2>Filters</h2>
            <div className="filter-buttons">
              <button
                onClick={() => setFilterCompleted(null)}
                className={`btn ${filterCompleted === null ? 'btn-active' : 'btn-secondary'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCompleted(false)}
                className={`btn ${filterCompleted === false ? 'btn-active' : 'btn-secondary'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterCompleted(true)}
                className={`btn ${filterCompleted === true ? 'btn-active' : 'btn-secondary'}`}
              >
                Completed
              </button>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="content-header">
            <h2>
              {selectedGroup
                ? groups.find((g) => g.id === selectedGroup)?.name || 'Tasks'
                : 'All Tasks'}
            </h2>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
              className="btn btn-primary"
            >
              + New Task
            </button>
          </div>

          <TaskList
            tasks={tasks}
            onEdit={handleEditTask}
            onDelete={handleTaskDeleted}
            onToggleComplete={loadData}
          />

          {showTaskForm && (
            <TaskForm
              task={editingTask}
              groups={groups}
              selectedGroup={selectedGroup || undefined}
              onClose={() => {
                setShowTaskForm(false);
                setEditingTask(null);
              }}
              onSave={editingTask ? handleTaskUpdated : handleTaskCreated}
            />
          )}

          {showGroupForm && (
            <GroupForm
              onClose={() => setShowGroupForm(false)}
              onSave={handleGroupCreated}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;


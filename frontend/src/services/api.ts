import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth header
api.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('todo_auth_credentials');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export interface Task {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  completed: number;
  group_id?: number;
  group_name?: string;
  group_color?: string;
}

export interface Group {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
}

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
};

export const fetchTasks = async (
  groupId?: number,
  completed?: boolean
): Promise<Task[]> => {
  const params: any = {};
  if (groupId) params.group_id = groupId;
  if (completed !== undefined) params.completed = completed;

  const response = await api.get('/api/tasks', { params });
  return response.data;
};

export const fetchTask = async (id: number): Promise<Task> => {
  const response = await api.get(`/api/tasks/${id}`);
  return response.data;
};

export const createTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await api.post('/api/tasks', task);
  return response.data;
};

export const updateTask = async (id: number, task: Partial<Task>): Promise<Task> => {
  const response = await api.put(`/api/tasks/${id}`, task);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/api/tasks/${id}`);
};

export const toggleTaskComplete = async (id: number, completed: boolean): Promise<Task> => {
  const response = await api.patch(`/api/tasks/${id}/complete`, { completed });
  return response.data;
};

export const fetchGroups = async (): Promise<Group[]> => {
  const response = await api.get('/api/groups');
  return response.data;
};

export const fetchGroup = async (id: number): Promise<Group> => {
  const response = await api.get(`/api/groups/${id}`);
  return response.data;
};

export const createGroup = async (group: Partial<Group>): Promise<Group> => {
  const response = await api.post('/api/groups', group);
  return response.data;
};

export const updateGroup = async (id: number, group: Partial<Group>): Promise<Group> => {
  const response = await api.put(`/api/groups/${id}`, group);
  return response.data;
};

export const deleteGroup = async (id: number): Promise<void> => {
  await api.delete(`/api/groups/${id}`);
};


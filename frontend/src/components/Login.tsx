import { useState } from 'react';
import { checkApiHealth } from '../services/api';
import './Login.css';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Test credentials by checking API health
      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        setError('Cannot connect to server. Please check if the backend is running.');
        setIsLoading(false);
        return;
      }

      // Try to authenticate by making a test request
      const { fetchTasks } = await import('../services/api');
      const { setAuthCredentials } = await import('../utils/auth');
      
      setAuthCredentials(username, password);
      
      // Test if credentials work
      try {
        await fetchTasks();
        onLogin(username, password);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Invalid username or password');
        } else {
          setError('Authentication failed. Please try again.');
        }
        const { clearAuthCredentials } = await import('../utils/auth');
        clearAuthCredentials();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>TODO Application</h1>
        <p className="login-subtitle">Sign in to manage your tasks</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-info">
          <p>Default credentials:</p>
          <p><strong>Username:</strong> admin</p>
          <p><strong>Password:</strong> admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;


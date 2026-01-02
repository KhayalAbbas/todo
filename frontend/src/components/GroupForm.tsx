import { useState } from 'react';
import { Group, createGroup } from '../services/api';
import './GroupForm.css';

interface GroupFormProps {
  onClose: () => void;
  onSave: () => void;
}

const PREDEFINED_COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4',
];

function GroupForm({ onClose, onSave }: GroupFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PREDEFINED_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const groupData: Partial<Group> = {
        name: name.trim(),
        color: color,
      };

      await createGroup(groupData);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Group</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="group-form">
          <div className="form-group">
            <label htmlFor="name">Group Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              autoFocus
              placeholder="e.g., Work, Personal, Shopping"
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Color</label>
            <div className="color-picker">
              {PREDEFINED_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${color === c ? 'color-selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  disabled={isLoading}
                  title={c}
                />
              ))}
            </div>
            <input
              type="color"
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isLoading}
              className="color-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GroupForm;


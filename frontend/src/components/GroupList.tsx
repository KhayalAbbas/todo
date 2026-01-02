import { Group } from '../services/api';
import './GroupList.css';

interface GroupListProps {
  groups: Group[];
  selectedGroup: number | null;
  onSelectGroup: (id: number) => void;
  onDelete: () => void;
}

function GroupList({ groups, selectedGroup, onSelectGroup, onDelete }: GroupListProps) {
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this group? Tasks in this group will be ungrouped.')) {
      try {
        const { deleteGroup } = await import('../services/api');
        await deleteGroup(id);
        onDelete();
      } catch (error) {
        console.error('Failed to delete group:', error);
        alert('Failed to delete group. Please try again.');
      }
    }
  };

  if (groups.length === 0) {
    return (
      <div className="group-list-empty">
        <p>No groups yet. Create one to organize your tasks!</p>
      </div>
    );
  }

  return (
    <div className="group-list">
      {groups.map((group) => (
        <div
          key={group.id}
          className={`group-item ${selectedGroup === group.id ? 'group-selected' : ''}`}
          onClick={() => onSelectGroup(group.id)}
        >
          <div className="group-info">
            <div
              className="group-color-indicator"
              style={{ backgroundColor: group.color || '#3498db' }}
            />
            <div className="group-details">
              <div className="group-name">{group.name}</div>
              <div className="group-task-count">
                {group.task_count || 0} {group.task_count === 1 ? 'task' : 'tasks'}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(group.id, e)}
            className="group-delete-btn"
            title="Delete group"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default GroupList;


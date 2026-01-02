import { Task } from '../services/api';
import { toggleTaskComplete, deleteTask } from '../services/api';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onToggleComplete: () => void;
}

function TaskItem({ task, onEdit, onDelete, onToggleComplete }: TaskItemProps) {
  const handleToggleComplete = async () => {
    try {
      await toggleTaskComplete(task.id, !task.completed);
      onToggleComplete();
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id);
        onDelete(task.id);
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { text: 'Overdue', className: 'deadline-overdue' };
    } else if (days === 0) {
      return { text: 'Due today', className: 'deadline-today' };
    } else if (days === 1) {
      return { text: 'Due tomorrow', className: 'deadline-soon' };
    } else if (days <= 7) {
      return { text: `Due in ${days} days`, className: 'deadline-soon' };
    } else {
      return { text: date.toLocaleDateString(), className: 'deadline-normal' };
    }
  };

  const deadlineInfo = formatDeadline(task.deadline);

  return (
    <div className={`task-item ${task.completed ? 'task-completed' : ''}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={!!task.completed}
          onChange={handleToggleComplete}
        />
      </div>

      <div className="task-content">
        <div className="task-header">
          <h3 className={task.completed ? 'task-title-completed' : ''}>
            {task.title}
          </h3>
          {task.group_name && (
            <span
              className="task-group-badge"
              style={{ backgroundColor: task.group_color || '#3498db' }}
            >
              {task.group_name}
            </span>
          )}
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        {deadlineInfo && (
          <div className={`task-deadline ${deadlineInfo.className}`}>
            {deadlineInfo.text}
          </div>
        )}
      </div>

      <div className="task-actions">
        <button
          onClick={() => onEdit(task)}
          className="btn btn-secondary btn-sm"
          title="Edit task"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="btn btn-danger btn-sm"
          title="Delete task"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default TaskItem;


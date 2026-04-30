import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useSocket } from '../lib/useSocket';
import {
  Plus, Users, ArrowLeft, Trash2, Calendar,
  UserPlus, X, Shield, User, ChevronDown
} from 'lucide-react';

// --- Helpers ---
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const avatarColors = [
  'bg-violet-500', 'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-fuchsia-500'
];

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'DONE') return false;
  return new Date(dueDate) < new Date();
};

const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const statusColors = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700'
};
const columnColors = {
  TODO: 'from-slate-50 to-slate-100/50',
  IN_PROGRESS: 'from-amber-50/50 to-orange-50/30',
  DONE: 'from-emerald-50/50 to-green-50/30'
};

// === MAIN COMPONENT ===
export const TaskBoard = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('MEMBER');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  // Task form
  const emptyTask = { title: '', description: '', status: 'TODO', priority: 'MEDIUM', assignedTo: '', dueDate: '' };
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [taskError, setTaskError] = useState('');

  // Member add
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [memberError, setMemberError] = useState('');

  const isAdmin = myRole === 'ADMIN';

  // --- Data Fetching ---
  const fetchProject = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
      setMyRole(res.data.myRole || 'MEMBER');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/projects');
      }
    }
  }, [projectId, navigate]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchTasks()]);
      setLoading(false);
    };
    load();
  }, [fetchProject, fetchTasks]);

  // --- Real-time Socket ---
  useSocket(projectId, {
    onTaskCreated: (task) => {
      setTasks(prev => {
        if (prev.find(t => t._id === task._id)) return prev;
        return [task, ...prev];
      });
    },
    onTaskUpdated: (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    },
    onTaskDeleted: ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    },
    onMemberAdded: () => fetchProject(),
    onMemberRemoved: ({ userId }) => {
      if (userId === currentUser?.id) {
        navigate('/projects');
      } else {
        fetchProject();
      }
    },
    onProjectDeleted: () => navigate('/projects')
  });

  // --- Task Actions ---
  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(emptyTask);
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'MEDIUM',
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskError('');
    try {
      const payload = {
        ...taskForm,
        projectId,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null
      };
      if (editingTask) {
        await api.patch(`/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setShowTaskModal(false);
      fetchTasks();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete task');
    }
  };

  // --- Member Actions ---
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setMemberRole('MEMBER');
      fetchProject();
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member? Their tasks will be unassigned.')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchProject();
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot remove member');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.patch(`/projects/${projectId}/members/${userId}`, { role: newRole });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot change role');
    }
  };

  // --- Group tasks by status ---
  const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(task => {
    if (grouped[task.status]) grouped[task.status].push(task);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{project?.name}</h1>
            {project?.description && <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>}
          </div>
          <span className={isAdmin ? 'badge-admin' : 'badge-member'}>{myRole}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMembersPanel(true)} className="btn-secondary flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{project?.members?.length || 0}</span>
          </button>
          {isAdmin && (
            <button onClick={openCreateTask} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {['TODO', 'IN_PROGRESS', 'DONE'].map(status => (
          <div key={status} className={`bg-gradient-to-b ${columnColors[status]} rounded-2xl p-4 min-h-[400px]`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`badge ${statusColors[status]}`}>{statusLabels[status]}</span>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-white/60 px-2 py-0.5 rounded-full">
                {grouped[status].length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped[status].map(task => (
                <div
                  key={task._id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-200 group cursor-pointer"
                  onClick={() => isAdmin ? openEditTask(task) : null}
                >
                  {/* Priority + Delete */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={
                      task.priority === 'HIGH' ? 'badge-high' :
                      task.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                    }>
                      {task.priority}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-semibold text-slate-800 text-sm mb-1">{task.title}</h4>
                  {task.description && (
                    <p className="text-slate-500 text-xs mb-3 line-clamp-2">{task.description}</p>
                  )}

                  {/* Footer: assignee, due date, status change */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(task.assignedTo.name)}`}>
                            {getInitials(task.assignedTo.name)}
                          </div>
                          <span className="text-xs text-slate-500">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue(task.dueDate, task.status) ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Status change for members (only their own tasks) */}
                  {(!isAdmin && task.assignedTo?._id === currentUser?.id) && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <select
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-violet-500/20"
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  )}

                  {/* Status change for admin */}
                  {isAdmin && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <select
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-violet-500/20"
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}

              {grouped[status].length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* === Task Create/Edit Modal === */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-5">
              {editingTask ? 'Edit Task' : 'Create Task'}
            </h2>
            {taskError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100">
                {taskError}
              </div>
            )}
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Optional description..."
                  value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select
                    className="input-field bg-white"
                    value={taskForm.status}
                    onChange={e => setTaskForm({...taskForm, status: e.target.value})}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select
                    className="input-field bg-white"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
                  <select
                    className="input-field bg-white"
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {project?.members?.map(m => (
                      <option key={m.user._id} value={m.user._id}>
                        {m.user.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Members Slide-out Panel === */}
      {showMembersPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowMembersPanel(false)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-800">Team Members</h2>
              <button onClick={() => setShowMembersPanel(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Member (Admin only) */}
              {isAdmin && (
                <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100/60">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-violet-600" /> Add Member
                  </h3>
                  {memberError && (
                    <div className="mb-3 p-2 bg-rose-50 text-rose-600 rounded-lg text-xs border border-rose-100">
                      {memberError}
                    </div>
                  )}
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <input
                      type="email"
                      className="input-field text-sm"
                      placeholder="Enter email address"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <select
                        className="input-field text-sm bg-white flex-1"
                        value={memberRole}
                        onChange={e => setMemberRole(e.target.value)}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button type="submit" className="btn-primary text-sm px-4">Add</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                  Members ({project?.members?.length || 0})
                </h3>
                <div className="space-y-2">
                  {project?.members?.map(member => (
                    <div key={member.user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAvatarColor(member.user.name)}`}>
                          {getInitials(member.user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {member.user.name}
                            {member.user._id === currentUser?.id && (
                              <span className="text-xs text-slate-400 ml-1">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && member.user._id !== currentUser?.id ? (
                          <>
                            <select
                              className="text-xs bg-transparent border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500/20"
                              value={member.role}
                              onChange={e => handleChangeRole(member.user._id, e.target.value)}
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.user._id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className={member.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}>
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

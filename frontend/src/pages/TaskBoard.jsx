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
  'bg-cherry-500', 'bg-electric-500', 'bg-sky-500', 'bg-emerald-500',
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
const columnAccents = { TODO: '#94a3b8', IN_PROGRESS: '#3b82f6', DONE: '#10b981' };
const statusBadgeStyle = {
  TODO: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  IN_PROGRESS: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  DONE: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
};

export const TaskBoard = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('MEMBER');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  const emptyTask = { title: '', description: '', status: 'TODO', priority: 'MEDIUM', assignedTo: '', dueDate: '' };
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [taskError, setTaskError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [memberError, setMemberError] = useState('');

  const isAdmin = myRole === 'ADMIN';

  const fetchProject = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
      setMyRole(res.data.myRole || 'MEMBER');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    }
  }, [projectId, navigate]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  }, [projectId]);

  useEffect(() => {
    const load = async () => { setLoading(true); await Promise.all([fetchProject(), fetchTasks()]); setLoading(false); };
    load();
  }, [fetchProject, fetchTasks]);

  useSocket(projectId, {
    onTaskCreated: (task) => setTasks(prev => prev.find(t => t._id === task._id) ? prev : [task, ...prev]),
    onTaskUpdated: (task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t)),
    onTaskDeleted: ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId)),
    onMemberAdded: () => fetchProject(),
    onMemberRemoved: ({ userId }) => { if (userId === currentUser?.id) navigate('/projects'); else fetchProject(); },
    onProjectDeleted: () => navigate('/projects')
  });

  const openCreateTask = () => { setEditingTask(null); setTaskForm(emptyTask); setTaskError(''); setShowTaskModal(true); };
  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description || '', status: task.status,
      priority: task.priority || 'MEDIUM', assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setTaskError(''); setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault(); setTaskError('');
    try {
      const payload = { ...taskForm, projectId, assignedTo: taskForm.assignedTo || null, dueDate: taskForm.dueDate || null };
      if (editingTask) await api.patch(`/tasks/${editingTask._id}`, payload);
      else await api.post('/tasks', payload);
      setShowTaskModal(false); fetchTasks();
    } catch (err) { setTaskError(err.response?.data?.message || 'Failed'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try { await api.patch(`/tasks/${taskId}`, { status: newStatus }); fetchTasks(); }
    catch (err) { alert(err.response?.data?.message || 'Cannot update status'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); fetchTasks(); }
    catch (err) { alert(err.response?.data?.message || 'Cannot delete task'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setMemberError('');
    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail(''); setMemberRole('MEMBER'); fetchProject();
    } catch (err) { setMemberError(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member? Their tasks will be unassigned.')) return;
    try { await api.delete(`/projects/${projectId}/members/${userId}`); fetchProject(); fetchTasks(); }
    catch (err) { alert(err.response?.data?.message || 'Cannot remove member'); }
  };

  const handleChangeRole = async (userId, newRole) => {
    try { await api.patch(`/projects/${projectId}/members/${userId}`, { role: newRole }); fetchProject(); }
    catch (err) { alert(err.response?.data?.message || 'Cannot change role'); }
  };

  const grouped = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(task => { if (grouped[task.status]) grouped[task.status].push(task); });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-cherry-500/30 border-t-cherry-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
            {project?.description && <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>}
          </div>
          <span className={isAdmin ? 'badge-admin' : 'badge-member'}>{myRole}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMembersPanel(true)} className="btn-secondary flex items-center gap-2">
            <Users className="w-4 h-4" /><span>{project?.members?.length || 0}</span>
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
          <div key={status} className="rounded-2xl p-4 min-h-[400px] border border-white/[0.04]"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: columnAccents[status], boxShadow: `0 0 8px ${columnAccents[status]}50` }} />
                <span className="text-sm font-semibold text-slate-300">{statusLabels[status]}</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: statusBadgeStyle[status].bg, color: statusBadgeStyle[status].color }}>
                {grouped[status].length}
              </span>
            </div>

            <div className="space-y-3">
              {grouped[status].map(task => (
                <div key={task._id}
                  className="p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.14] transition-all duration-300 group cursor-pointer hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                  onClick={() => isAdmin ? openEditTask(task) : null}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={task.priority === 'HIGH' ? 'badge-high' : task.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'}>
                      {task.priority}
                    </span>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-cherry-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-200 text-sm mb-1">{task.title}</h4>
                  {task.description && <p className="text-slate-500 text-xs mb-3 line-clamp-2">{task.description}</p>}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(task.assignedTo.name)}`}>
                            {getInitials(task.assignedTo.name)}
                          </div>
                          <span className="text-xs text-slate-400">{task.assignedTo.name}</span>
                        </div>
                      ) : <span className="text-xs text-slate-600 italic">Unassigned</span>}
                    </div>
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue(task.dueDate, task.status) ? 'text-cherry-400 font-semibold' : 'text-slate-500'}`}>
                        <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Status dropdown */}
                  {(isAdmin || (!isAdmin && task.assignedTo?._id === currentUser?.id)) && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <select className="w-full text-xs border border-white/10 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-cherry-500/20 text-slate-300"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)}>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
              {grouped[status].length === 0 && <div className="text-center py-8 text-xs text-slate-600">No tasks</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, #e11d48, #3b82f6, transparent)' }} />
            <h2 className="text-xl font-bold text-white mb-5">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            {taskError && (
              <div className="mb-4 p-3 rounded-xl text-sm border border-cherry-500/20"
                style={{ background: 'rgba(225,29,72,0.08)', color: '#fb7185' }}>{taskError}</div>
            )}
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
                <input type="text" className="input-field" placeholder="Task title"
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                <textarea className="input-field min-h-[80px] resize-none" placeholder="Optional description..."
                  value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Status</label>
                  <select className="input-field" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Priority</label>
                  <select className="input-field" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Assign To</label>
                  <select className="input-field" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project?.members?.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Due Date</label>
                  <input type="date" className="input-field" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Panel */}
      {showMembersPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowMembersPanel(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
          <div className="relative w-full max-w-md h-full shadow-2xl animate-slide-in overflow-y-auto border-l border-white/[0.06]"
            style={{ background: 'linear-gradient(180deg, #0f0f0f, #0a0a0a)' }}
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 border-b border-white/[0.06] p-6 flex items-center justify-between z-10"
              style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(12px)' }}>
              <h2 className="text-lg font-bold text-white">Team Members</h2>
              <button onClick={() => setShowMembersPanel(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {isAdmin && (
                <div className="rounded-xl p-4 border border-cherry-500/10" style={{ background: 'rgba(225,29,72,0.04)' }}>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-cherry-400" /> Add Member
                  </h3>
                  {memberError && (
                    <div className="mb-3 p-2 rounded-lg text-xs border border-cherry-500/20"
                      style={{ background: 'rgba(225,29,72,0.08)', color: '#fb7185' }}>{memberError}</div>
                  )}
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <input type="email" className="input-field text-sm" placeholder="Enter email address"
                      value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
                    <div className="flex gap-2">
                      <select className="input-field text-sm flex-1" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                        <option value="MEMBER">Member</option><option value="ADMIN">Admin</option>
                      </select>
                      <button type="submit" className="btn-primary text-sm px-4">Add</button>
                    </div>
                  </form>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                  Members ({project?.members?.length || 0})
                </h3>
                <div className="space-y-2">
                  {project?.members?.map(member => (
                    <div key={member.user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAvatarColor(member.user.name)}`}>
                          {getInitials(member.user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-300">
                            {member.user.name}
                            {member.user._id === currentUser?.id && <span className="text-xs text-slate-500 ml-1">(you)</span>}
                          </p>
                          <p className="text-xs text-slate-500">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && member.user._id !== currentUser?.id ? (
                          <>
                            <select className="text-xs border border-white/10 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-cherry-500/20 text-slate-300"
                              style={{ background: 'rgba(255,255,255,0.04)' }}
                              value={member.role} onChange={e => handleChangeRole(member.user._id, e.target.value)}>
                              <option value="ADMIN">Admin</option><option value="MEMBER">Member</option>
                            </select>
                            <button onClick={() => handleRemoveMember(member.user._id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-cherry-400 rounded-lg transition-all" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className={member.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}>{member.role}</span>
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

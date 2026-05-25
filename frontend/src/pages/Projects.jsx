import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Users, FolderKanban, TrendingUp, Trash2 } from 'lucide-react';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const token = useAuthStore(state => state.token);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchProjects(); }, [token]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-cherry-500/30 border-t-cherry-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map(project => (
          <Link key={project._id} to={`/projects/${project._id}/board`}
            className="glass-card-hover p-6 block group relative">
            {/* Red/blue gradient top accent on hover */}
            <div className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(90deg, transparent, #e11d48, #3b82f6, transparent)' }} />

            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl border border-cherry-500/10 flex items-center justify-center"
                style={{ background: 'rgba(225,29,72,0.08)' }}>
                <FolderKanban className="w-5 h-5 text-cherry-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className={project.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}>
                  {project.myRole}
                </span>
                {project.myRole === 'ADMIN' && (
                  <button onClick={(e) => handleDeleteProject(e, project._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-cherry-400 rounded-lg transition-all"
                    title="Delete project">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white group-hover:text-cherry-400 transition-colors duration-300 mb-1">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{project.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-white/[0.06]">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {project.members?.length || 0} members</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {project.taskCount || 0} tasks</span>
            </div>

            {project.taskCount > 0 && (
              <div className="mt-3">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progressPercent}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{project.progressPercent}% complete</p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl border border-cherry-500/10 flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(225,29,72,0.06)' }}>
            <FolderKanban className="w-8 h-8 text-cherry-400/50" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" /> Create Project
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, #e11d48, #3b82f6, transparent)' }} />
            <h2 className="text-xl font-bold text-white mb-5">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Project Name</label>
                <input type="text" className="input-field" placeholder="e.g. Mobile App Redesign"
                  value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})}
                  required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                <textarea className="input-field min-h-[100px] resize-none" placeholder="Brief description..."
                  value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

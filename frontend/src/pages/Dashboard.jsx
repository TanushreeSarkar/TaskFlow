import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import {
  CheckCircle2, Clock, ListTodo, AlertTriangle,
  FolderKanban, TrendingUp, ArrowRight, Calendar, Sparkles
} from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    // Don't fetch until token is available in the store
    if (!token) return;

    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-cherry-500/30 border-t-cherry-500 rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      label: 'Projects', value: stats?.totalProjects || 0, icon: FolderKanban,
      gradient: 'linear-gradient(135deg, #e11d48, #be123c)',
      glow: '0 4px 20px rgba(225,29,72,0.25)',
    },
    {
      label: 'Total Tasks', value: stats?.totalTasks || 0, icon: ListTodo,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      glow: '0 4px 20px rgba(59,130,246,0.25)',
    },
    {
      label: 'In Progress', value: stats?.tasksPerStatus?.IN_PROGRESS || 0, icon: Clock,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      glow: '0 4px 20px rgba(245,158,11,0.25)',
    },
    {
      label: 'Overdue', value: stats?.overdueCount || 0, icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      glow: '0 4px 20px rgba(239,68,68,0.25)',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #e11d48, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        {/* Red-blue accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, #e11d48, transparent 30%, transparent 70%, #3b82f6)' }} />
        <div className="relative z-[1]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-cherry-400" />
            <p className="text-sm text-cherry-400 font-medium">Welcome back</p>
          </div>
          <h1 className="text-2xl font-bold text-white">{user?.name || 'Dashboard'}</h1>
          <p className="text-slate-500 text-sm mt-1">Here's what's happening across your projects</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, gradient, glow }) => (
          <div key={label} className="glass-card p-5 flex items-center gap-4 group hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1">
            <div className="stat-icon" style={{ background: gradient, boxShadow: glow }}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Project Progress</h2>
            <Link to="/projects" className="text-sm text-cherry-400 font-medium hover:text-cherry-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats?.projectStats?.length > 0 ? (
            <div className="space-y-4">
              {stats.projectStats.map(project => (
                <Link key={project._id} to={`/projects/${project._id}/board`} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-300 group-hover:text-cherry-400 transition-colors">
                        {project.name}
                      </span>
                      <span className={project.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}>
                        {project.myRole}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {project.completedTasks}/{project.totalTasks} done
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${project.progressPercent}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-8">No projects yet</p>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-5">Overdue Tasks</h2>
          {stats?.overdueTasks?.length > 0 ? (
            <div className="space-y-3">
              {stats.overdueTasks.slice(0, 6).map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:border-cherry-500/20"
                  style={{ background: 'rgba(225,29,72,0.04)', borderColor: 'rgba(225,29,72,0.1)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-300 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-cherry-400" />
                      <span className="text-xs text-cherry-400 font-medium">Due {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <span className={task.status === 'TODO' ? 'badge-todo' : 'badge-progress'}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No overdue tasks!</p>
            </div>
          )}
        </div>
      </div>

      {/* My Tasks */}
      {stats?.myTasks?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-5">My Assigned Tasks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.myTasks.map(task => (
              <div key={task._id} className="p-4 rounded-xl border border-white/[0.06] transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm font-semibold text-slate-300 mb-2 truncate">{task.title}</p>
                <div className="flex items-center gap-2">
                  <span className={
                    task.status === 'TODO' ? 'badge-todo' :
                    task.status === 'IN_PROGRESS' ? 'badge-progress' : 'badge-done'
                  }>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-slate-500">{formatDate(task.dueDate)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

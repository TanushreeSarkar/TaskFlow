import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import {
  CheckCircle2, Clock, ListTodo, AlertTriangle,
  FolderKanban, TrendingUp, ArrowRight, Calendar
} from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your projects and tasks</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card">
          <div className="stat-icon bg-violet-50 text-violet-600">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Projects</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.totalProjects || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-sky-50 text-sky-600">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.totalTasks || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">In Progress</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.tasksPerStatus?.IN_PROGRESS || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-rose-50 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Overdue</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.overdueCount || 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800">Project Progress</h2>
            <Link to="/projects" className="text-sm text-violet-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats?.projectStats?.length > 0 ? (
            <div className="space-y-4">
              {stats.projectStats.map(project => (
                <Link key={project._id} to={`/projects/${project._id}/board`} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-violet-600 transition-colors">
                        {project.name}
                      </span>
                      <span className={project.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}>
                        {project.myRole}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
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
            <p className="text-sm text-slate-400 text-center py-8">No projects yet</p>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Overdue Tasks</h2>
          {stats?.overdueTasks?.length > 0 ? (
            <div className="space-y-3">
              {stats.overdueTasks.slice(0, 6).map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100/60">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-rose-400" />
                      <span className="text-xs text-rose-500 font-medium">Due {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <span className={task.status === 'TODO' ? 'badge-todo' : 'badge-progress'}>{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No overdue tasks!</p>
            </div>
          )}
        </div>
      </div>

      {/* My Tasks */}
      {stats?.myTasks?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5">My Assigned Tasks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.myTasks.map(task => (
              <div key={task._id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-700 mb-2 truncate">{task.title}</p>
                <div className="flex items-center gap-2">
                  <span className={
                    task.status === 'TODO' ? 'badge-todo' :
                    task.status === 'IN_PROGRESS' ? 'badge-progress' : 'badge-done'
                  }>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-slate-400">{formatDate(task.dueDate)}</span>
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

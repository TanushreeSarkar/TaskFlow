import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, FolderKanban, LogOut, Zap } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">TaskFlow v1.0</p>
      </div>
    </div>
  );
};

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

const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 ml-64 fixed top-0 right-0 left-0 z-10">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right mr-1">
          <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <div className={`avatar ${getAvatarColor(user?.name)}`}>
          {getInitials(user?.name)}
        </div>
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export const Layout = () => {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-8">
        <Outlet />
      </main>
    </div>
  );
};
// Built with ❤️ for the **[Ethara.AI](https://ethara.ai)** Full-Stack Engineering Assessment 
// By Tanushree Sarkar (2201641530214)
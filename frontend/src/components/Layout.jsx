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
    <div className="w-64 h-screen fixed left-0 top-0 flex flex-col z-20 border-r border-white/[0.06]"
      style={{ background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #e11d48, #3b82f6)', boxShadow: '0 4px 15px rgba(225,29,72,0.3)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold gradient-text">
            TaskFlow
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(225,29,72,0.12), rgba(59,130,246,0.08))',
                border: '1px solid rgba(225,29,72,0.18)',
                boxShadow: '0 0 20px rgba(225,29,72,0.08)',
              } : {}}
            >
              <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-cherry-400' : ''}`} />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cherry-500 animate-pulse-soft"
                  style={{ boxShadow: '0 0 8px rgba(225,29,72,0.6)' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-slate-600 text-center">TaskFlow v1.0 · Ethara.AI</p>
      </div>
    </div>
  );
};

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

const Navbar = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
    // HashRouter: redirect via hash
    window.location.hash = '#/login';
  };

  return (
    <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 ml-64 fixed top-0 right-0 left-0 z-10"
      style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right mr-1">
          <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <div className={`avatar ${getAvatarColor(user?.name)} ring-2 ring-white/10`}>
          {getInitials(user?.name)}
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-cherry-400 rounded-lg transition-all duration-300"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export const Layout = () => {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Subtle background mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-[0.025]"
          style={{ background: 'radial-gradient(circle, #e11d48, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.02]"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
      </div>
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 p-8 relative z-[1]">
        <Outlet />
      </main>
    </div>
  );
};
// Built with ❤️ for the **[Ethara.AI](https://ethara.ai)** Full-Stack Engineering Assessment 
// By Tanushree Sarkar (2201641530214)
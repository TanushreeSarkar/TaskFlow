import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { TechFlowers } from '../components/TechFlowers';

export const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark-950">
      {/* Tech Flowers Background */}
      <TechFlowers />

      {/* Glass card */}
      <div className="w-full max-w-md p-8 relative z-10 rounded-2xl border border-white/[0.08] animate-slide-up"
        style={{
          background: 'linear-gradient(145deg, rgba(15,15,15,0.92), rgba(5,5,5,0.96))',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.04)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Blue-to-red gradient top accent */}
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #e11d48, transparent)' }} />

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ring-white/10"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #e11d48)', boxShadow: '0 8px 25px rgba(59,130,246,0.3)' }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1.5">Create account</h1>
          <p className="text-slate-500 text-sm">Get started with TaskFlow today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm border border-cherry-500/20 flex items-center gap-2"
            style={{ background: 'rgba(225,29,72,0.08)', color: '#fb7185' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-electric-400 font-semibold hover:text-electric-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

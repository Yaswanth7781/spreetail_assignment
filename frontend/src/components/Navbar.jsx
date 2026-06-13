import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <span className="font-bold text-slate-800 text-lg tracking-tight">SplitEase</span>
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              Hi, <span className="font-medium text-slate-800">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium px-3 py-1 rounded-lg hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

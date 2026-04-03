import { Link, useNavigate } from 'react-router-dom';
import { getToken, clearAuth } from '../services/auth';

export default function Header() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-xl text-brand-700">
          <span className="text-2xl">🧠</span>
          <span>Gehirnjogging</span>
        </Link>

        <nav className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-brand-700 font-medium">
                Dashboard
              </Link>
              <Link to="/settings" className="text-sm text-gray-600 hover:text-brand-700 font-medium">
                Einstellungen
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-700">
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-brand-700 font-medium">
                Anmelden
              </Link>
              <Link to="/signup" className="btn-primary text-sm py-2 px-4">
                Kostenlos starten
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

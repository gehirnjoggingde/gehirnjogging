import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getToken, clearAuth } from '../services/auth';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!getToken();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearAuth();
    navigate('/');
    setMenuOpen(false);
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`text-sm font-medium transition-colors ${
        location.pathname === to
          ? 'text-brand-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isLoggedIn ? '/dashboard' : '/'}
          className="flex items-center gap-2.5 select-none"
        >
          <img src="/logo.png" alt="Gehirnjogging" className="h-8 w-8 object-contain" />
          <span className="font-bold text-lg text-navy-900 tracking-tight">
            Gehirn<span className="text-brand-600">jogging</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {isLoggedIn ? (
            <>
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/settings', 'Einstellungen')}
              <button
                onClick={handleLogout}
                className="ml-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                Abmelden
              </button>
            </>
          ) : (
            <>
              {navLink('/login', 'Anmelden')}
              <Link to="/signup" className="btn-primary ml-2 py-2 px-4 text-sm">
                Kostenlos starten
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menü"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-gray-700 rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-gray-700 rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-gray-700 rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2">Dashboard</Link>
              <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2">Einstellungen</Link>
              <button onClick={handleLogout} className="text-sm text-red-500 text-left py-2">Abmelden</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2">Anmelden</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">Kostenlos starten</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

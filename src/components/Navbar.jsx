'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Menu, X, MessageSquare, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Super<span className="text-blue-600">Profe</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/chats" className="btn-ghost flex items-center gap-2">
                  <MessageSquare size={18} />
                  Mensajes
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-semibold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700" onClick={() => setDropdownOpen(false)}>
                        <User size={16} /> Mi panel
                      </Link>
                      <Link href="/suscripcion" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700" onClick={() => setDropdownOpen(false)}>
                        ⭐ Suscripción
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full text-left">
                        <LogOut size={16} /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost">Iniciar sesión</Link>
                <Link href="/dar-clases" className="btn-primary text-sm">
                  Dar clases particulares
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <Link href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mi panel</Link>
                <Link href="/chats" className="block px-4 py-2 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Mensajes</Link>
                <Link href="/suscripcion" className="block px-4 py-2 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Suscripción</Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 text-red-600">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-4 py-2 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
                <Link href="/dar-clases" className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center" onClick={() => setMenuOpen(false)}>
                  Dar clases particulares
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

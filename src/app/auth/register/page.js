'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap, BookOpen } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const isTeacher = searchParams.get('role') === 'teacher';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: isTeacher ? 'teacher' : 'student' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('¡Cuenta creada! Verificá tu email.');
      router.push('/auth/verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold">Super<span className="text-blue-600">Profe</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 mt-2">Empezá gratis hoy mismo</p>
        </div>

        <div className="card p-8">
          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'student' })}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.role === 'student' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              <GraduationCap size={24} />
              <span className="font-medium text-sm">Soy alumno</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'teacher' })}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.role === 'teacher' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              <BookOpen size={24} />
              <span className="font-medium text-sm">Soy profesor</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@email.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-3.5 mt-2">
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            ¿Ya tenés cuenta?{' '}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import TeacherCard from '../components/TeacherCard';
import ReviewCard from '../components/ReviewCard';
import { teachers as teachersApi, reviews as reviewsApi } from '../lib/api';
import { Search, ChevronRight, BookOpen, Calculator, Atom, Languages, Music, Code, Palette, Globe } from 'lucide-react';

const CATEGORIES = [
  { label: 'Matemática', icon: Calculator, color: 'bg-blue-100 text-blue-600' },
  { label: 'Idiomas', icon: Languages, color: 'bg-green-100 text-green-600' },
  { label: 'Ciencias', icon: Atom, color: 'bg-purple-100 text-purple-600' },
  { label: 'Programación', icon: Code, color: 'bg-orange-100 text-orange-600' },
  { label: 'Música', icon: Music, color: 'bg-pink-100 text-pink-600' },
  { label: 'Arte', icon: Palette, color: 'bg-red-100 text-red-600' },
  { label: 'Historia', icon: BookOpen, color: 'bg-yellow-100 text-yellow-600' },
  { label: 'Geografía', icon: Globe, color: 'bg-teal-100 text-teal-600' },
];

const STATS = [
  { value: '10.000+', label: 'Profesores activos' },
  { value: '50.000+', label: 'Alumnos satisfechos' },
  { value: '4.8/5', label: 'Calificación promedio' },
  { value: '100%', label: 'Clases virtuales' },
];

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [featuredTeachers, setFeaturedTeachers] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teachersApi.featured().then((r) => setFeaturedTeachers(r.data)).catch(() => {}),
      reviewsApi.landing().then((r) => setLatestReviews(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    else router.push('/buscar');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-indigo-300 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                🎓 La plataforma #1 de clases particulares en Argentina
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Encontrá el profe perfecto para{' '}
                <span className="text-yellow-300">superarte</span>
              </h1>
              <p className="text-blue-100 text-lg mb-10 leading-relaxed">
                Miles de profesores particulares listos para ayudarte en cualquier materia.
                Clases virtuales, a tu ritmo y en tu horario.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-white rounded-2xl shadow-2xl p-2 gap-2">
                  <Search className="text-gray-400 ml-3 flex-shrink-0" size={22} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="¿Qué querés aprender? Ej: Matemática, Inglés, Python..."
                    className="flex-1 py-3 px-2 text-gray-800 placeholder-gray-400 outline-none text-lg bg-transparent"
                  />
                  <button type="submit" className="btn-primary whitespace-nowrap">
                    Buscar profe
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-2 mt-4">
                {['Matemática', 'Inglés', 'Física', 'Guitarra', 'Python'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); router.push(`/buscar?q=${s}`); }}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full transition-all backdrop-blur-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero image placeholder */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="w-80 h-80 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
                  <div className="text-center">
                    <div className="text-8xl mb-4">👨‍🏫</div>
                    <p className="text-white font-semibold text-xl">Clases 100% virtuales</p>
                    <p className="text-blue-200 mt-1">Desde cualquier lugar</p>
                  </div>
                </div>
                {/* Floating cards */}
                <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">⭐</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">4.9/5</div>
                    <div className="text-xs text-gray-500">Calificación</div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">🎓</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">10k+ profes</div>
                    <div className="text-xs text-gray-500">Disponibles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-extrabold text-blue-600">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Explorá por materia</h2>
            <p className="text-gray-500 mt-1">Encontrá profesores especializados en lo que necesitás</p>
          </div>
          <Link href="/buscar" className="hidden md:flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
            Ver todos <ChevronRight size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              onClick={() => router.push(`/buscar?q=${label}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED TEACHERS */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Profesores destacados</h2>
              <p className="text-gray-500 mt-1">Los más valorados por nuestros alumnos</p>
            </div>
            <Link href="/buscar" className="hidden md:flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
              Ver todos <ChevronRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTeachers.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {featuredTeachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <p>Todavía no hay profesores registrados.</p>
              <Link href="/dar-clases" className="btn-primary inline-block mt-4">
                ¡Sé el primero en publicar!
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/buscar" className="btn-secondary inline-flex items-center gap-2">
              Ver todos los profesores <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">¿Cómo funciona?</h2>
          <p className="text-gray-500 mt-2">En tres simples pasos empezás a aprender</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: '1', icon: '🔍', title: 'Buscá tu profe', desc: 'Buscá por materia, nivel o precio. Nuestro algoritmo te muestra los mejores matches.' },
            { num: '2', icon: '💬', title: 'Contactalo', desc: 'Enviá una solicitud de chat al profe que te interese. El decide aceptar o no.' },
            { num: '3', icon: '📚', title: '¡A estudiar!', desc: 'Una vez aceptado, coordinan directamente la clase por el chat integrado.' },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl mx-auto">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-bold flex items-center justify-center">
                  {step.num}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      {latestReviews.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros alumnos</h2>
              <p className="text-gray-500 mt-2">Experiencias reales de estudiantes en SuperProfe</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestReviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — Dar clases */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ¿Sos profesor? Publicá tus clases gratis
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Creá tu perfil, publicá tu anuncio y empezá a conseguir alumnos hoy mismo.
            Miles de estudiantes te están buscando.
          </p>
          <Link href="/dar-clases" className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl inline-block text-lg">
            Empezar a dar clases →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-white font-bold text-lg">SuperProfe</span>
              </div>
              <p className="text-sm leading-relaxed">La plataforma líder de clases particulares virtuales en Argentina.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Para alumnos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/buscar" className="hover:text-white transition-colors">Buscar profesores</Link></li>
                <li><Link href="/suscripcion" className="hover:text-white transition-colors">Planes y precios</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Para profesores</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dar-clases" className="hover:text-white transition-colors">Publicar anuncio</Link></li>
                <li><Link href="/suscripcion" className="hover:text-white transition-colors">Planes para profes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">SuperProfe</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Registrarse</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 SuperProfe. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

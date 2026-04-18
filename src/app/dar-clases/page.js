'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { announcements as announcementsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { BookOpen, DollarSign, AlignLeft, Tag } from 'lucide-react';

const SUBJECTS = ['Matemática', 'Física', 'Química', 'Biología', 'Historia', 'Geografía', 'Inglés', 'Francés', 'Portugués', 'Programación', 'Música', 'Arte', 'Otro'];
const LEVELS = ['todos', 'primaria', 'secundaria', 'universitario', 'adultos'];
const MODALITIES = ['virtual', 'presencial', 'ambas'];
const PRICE_TYPES = [{ value: 'hour', label: 'por hora' }, { value: 'class', label: 'por clase' }, { value: 'month', label: 'por mes' }];

export default function DarClasesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    customSubject: '',
    price: '',
    priceType: 'hour',
    level: 'todos',
    modality: 'virtual',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=form, 2=preview

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      // Save form to localStorage and redirect to register
      localStorage.setItem('pending_announcement', JSON.stringify(form));
      router.push('/auth/register?role=teacher&from=dar-clases');
      return;
    }

    if (user.role !== 'teacher') {
      toast.error('Solo los profesores pueden publicar anuncios');
      return;
    }

    if (!user.is_verified) {
      router.push('/auth/verify');
      return;
    }

    setLoading(true);
    try {
      const subject = form.subject === 'Otro' ? form.customSubject : form.subject;
      await announcementsApi.create({
        title: form.title,
        description: form.description,
        subject,
        price: parseFloat(form.price),
        price_type: form.priceType,
        level: form.level,
        modality: form.modality,
      });
      toast.success('¡Anuncio publicado exitosamente!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al publicar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Publicá tus clases particulares
          </h1>
          <p className="text-blue-100 text-lg">
            Creá tu anuncio en minutos y empezá a conseguir alumnos hoy mismo
          </p>
          {!user && (
            <p className="text-blue-200 text-sm mt-3">
              Al finalizar te pediremos que crees tu cuenta o inicies sesión
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Tag size={16} className="text-blue-600" /> Materia / Área
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, subject: s })}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${form.subject === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {form.subject === 'Otro' && (
                <input
                  type="text"
                  required
                  value={form.customSubject}
                  onChange={(e) => setForm({ ...form, customSubject: e.target.value })}
                  placeholder="¿Qué materia enseñás?"
                  className="input-field mt-2"
                />
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" /> Título del anuncio
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Clases de Matemática para secundaria y preuniversitario"
                className="input-field"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <AlignLeft size={16} className="text-blue-600" /> Descripción
              </label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describí tu metodología, experiencia, qué temas cubrís, etc."
                rows={5}
                className="input-field resize-none"
              />
            </div>

            {/* Price + type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-600" /> Precio (ARS)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="2500"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Modalidad de cobro</label>
                <select value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })} className="input-field">
                  {PRICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Level + modality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nivel educativo</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="input-field">
                  {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l === 'todos' ? 'Todos' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Modalidad de clase</label>
                <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })} className="input-field">
                  {MODALITIES.map((m) => <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.subject || !form.title || !form.description || !form.price}
              className="btn-primary w-full text-lg py-4"
            >
              {loading ? 'Publicando...' : user ? 'Publicar anuncio' : 'Continuar y crear cuenta →'}
            </button>
          </form>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {['Gratis para empezar', 'Miles de alumnos', 'Chat integrado'].map((b) => (
            <div key={b} className="text-center p-4 bg-white rounded-xl border border-gray-100">
              <p className="text-sm font-medium text-gray-600">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

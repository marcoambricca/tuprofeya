'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import ReviewCard from '../../../components/ReviewCard';
import StarRating from '../../../components/StarRating';
import { teachers as teachersApi, requests as requestsApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Star, MapPin, Users, Award, BookOpen, MessageSquare,
  CheckCircle, ChevronRight, DollarSign
} from 'lucide-react';

export default function TeacherProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestModal, setRequestModal] = useState(null); // announcement
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    teachersApi.getById(id)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Perfil no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequestChat = async (announcement) => {
    if (!user) {
      localStorage.setItem('redirect_after_login', `/profesor/${id}`);
      router.push('/auth/register?from=request');
      return;
    }
    if (user.role === 'teacher') {
      toast.error('Los profesores no pueden solicitar chats');
      return;
    }
    setRequestModal(announcement);
  };

  const submitRequest = async () => {
    if (!requestModal) return;
    setRequesting(true);
    try {
      await requestsApi.create({
        announcementId: requestModal.id,
        message: requestMessage,
      });
      toast.success('¡Solicitud enviada! El profesor la revisará pronto.');
      setRequestModal(null);
      setRequestMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar solicitud');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-4">
          <div className="h-48 bg-white rounded-2xl" />
          <div className="h-64 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, announcements, reviews, stats, certificates } = data;
  const rating = parseFloat(stats?.avg_rating) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile header */}
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-bold">{profile.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.city && (
                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                      <MapPin size={15} />
                      <span className="text-sm">{profile.city}, {profile.country}</span>
                    </div>
                  )}
                </div>
                {profile.subscription_plan && profile.subscription_plan !== 'basic' && (
                  <span className={`badge ${profile.subscription_plan === 'max' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {profile.subscription_plan === 'max' ? '⭐ Premium' : '✓ Pro'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-gray-900">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                  <span className="text-gray-400 text-sm">({stats?.total_reviews || 0} reseñas)</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users size={17} />
                  <span className="text-sm">{profile.total_students} alumnos</span>
                </div>
              </div>

              {profile.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.subjects.map((s) => (
                    <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">Sobre mí</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {profile.experience && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Experiencia</h3>
              <p className="text-gray-600 leading-relaxed">{profile.experience}</p>
            </div>
          )}

          {profile.aptitudes?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Aptitudes</h3>
              <div className="flex flex-wrap gap-2">
                {profile.aptitudes.map((a) => (
                  <span key={a} className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
                    <CheckCircle size={13} className="text-green-500" /> {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Announcements */}
        {announcements?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Clases disponibles</h2>
            <div className="space-y-4">
              {announcements.filter((a) => a.is_active).map((ann) => (
                <div key={ann.id} className="card p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={16} className="text-blue-600" />
                        <span className="badge bg-blue-50 text-blue-700 text-xs">{ann.subject}</span>
                        {ann.level && ann.level !== 'todos' && (
                          <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">{ann.level}</span>
                        )}
                        <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">{ann.modality}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{ann.title}</h3>
                      <p className="text-gray-500 mt-1 text-sm leading-relaxed">{ann.description}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          ${Number(ann.price).toLocaleString('es-AR')}
                        </div>
                        <div className="text-xs text-gray-400">
                          por {ann.price_type === 'hour' ? 'hora' : ann.price_type === 'class' ? 'clase' : 'mes'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRequestChat(ann)}
                        className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
                      >
                        <MessageSquare size={16} />
                        Solicitar chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {certificates?.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={20} className="text-blue-600" /> Certificados y titulaciones
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {certificates.map((cert) => (
                <a
                  key={cert.id}
                  href={cert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{cert.name}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Reseñas de alumnos</h2>
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(rating)} readonly size={18} />
                <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="card p-4 mb-4">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = parseInt(stats?.[`${['', 'one', 'two', 'three', 'four', 'five'][n]}_star`]) || 0;
                const pct = stats?.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-3 py-1">
                    <span className="text-sm text-gray-500 w-4">{n}</span>
                    <Star size={13} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-400 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          </div>
        )}
      </div>

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setRequestModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Solicitar chat</h3>
            <p className="text-gray-500 text-sm mb-4">
              Enviás una solicitud a <strong>{profile.name}</strong> para <strong>{requestModal.subject}</strong>
            </p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Contale al profesor qué necesitás aprender, tu nivel actual y cuándo podés conectarte..."
              rows={4}
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRequestModal(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={submitRequest} disabled={requesting} className="btn-primary flex-1">
                {requesting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

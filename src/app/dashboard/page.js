'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  teachers as teachersApi,
  announcements as announcementsApi,
  requests as requestsApi,
  chats as chatsApi,
  subscriptions as subscriptionsApi,
  uploads,
} from '../../lib/api';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Check, X, Star, Bell, Users, BookOpen, Settings, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [reqRes, chatRes, subRes] = await Promise.all([
        requestsApi.list(),
        chatsApi.list(),
        subscriptionsApi.mine(),
      ]);
      setRequests(reqRes.data);
      setChatList(chatRes.data);
      setSubscription(subRes.data);

      if (user.role === 'teacher') {
        const profRes = await teachersApi.myProfile();
        setProfile(profRes.data.profile);
        setAnnouncements(profRes.data.announcements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAccept = async (id) => {
    setProcessingId(id);
    try {
      await requestsApi.accept(id);
      toast.success('Solicitud aceptada. ¡Ya podés chatear!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await requestsApi.reject(id);
      toast.success('Solicitud rechazada');
      loadData();
    } catch (err) {
      toast.error('Error al rechazar');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploads.avatar(file);
      toast.success('Foto actualizada');
      loadData();
    } catch {
      toast.error('Error al subir foto');
    }
  };

  const toggleAnnouncement = async (ann) => {
    try {
      await announcementsApi.update(ann.id, { is_active: !ann.is_active });
      toast.success(ann.is_active ? 'Anuncio pausado' : 'Anuncio activado');
      loadData();
    } catch { toast.error('Error'); }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      await announcementsApi.delete(id);
      toast.success('Anuncio eliminado');
      loadData();
    } catch { toast.error('Error'); }
  };

  if (authLoading || !user) return null;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const unreadChats = chatList.filter((c) => parseInt(c.unread_count) > 0).length;

  const TABS = user.role === 'teacher'
    ? ['overview', 'requests', 'chats', 'announcements', 'profile']
    : ['overview', 'requests', 'chats'];

  const TAB_LABELS = { overview: 'Panel', requests: 'Solicitudes', chats: 'Mensajes', announcements: 'Anuncios', profile: 'Mi perfil' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hola, {user.name.split(' ')[0]}!</h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">{user.role === 'teacher' ? 'Profesor' : 'Alumno'}</p>
          </div>
          {user.role === 'teacher' && (
            <Link href="/dar-clases" className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Nuevo anuncio
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-max py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {TAB_LABELS[tab]}
              {tab === 'requests' && pendingRequests.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full inline-flex items-center justify-center">{pendingRequests.length}</span>
              )}
              {tab === 'chats' && unreadChats > 0 && (
                <span className="ml-1.5 bg-blue-400 text-white text-xs w-5 h-5 rounded-full inline-flex items-center justify-center">{unreadChats}</span>
              )}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="grid md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {user.role === 'teacher' ? [
                    { label: 'Anuncios activos', value: announcements.filter((a) => a.is_active).length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Solicitudes pendientes', value: pendingRequests.length, icon: Bell, color: 'text-red-600 bg-red-50' },
                    { label: 'Chats activos', value: chatList.length, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
                    { label: 'Plan actual', value: subscription?.plan || 'básico', icon: Star, color: 'text-amber-600 bg-amber-50' },
                  ] : [
                    { label: 'Solicitudes enviadas', value: requests.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Chats activos', value: chatList.length, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
                    { label: 'Plan actual', value: subscription?.plan || 'inicial', icon: Star, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Mensajes sin leer', value: unreadChats, icon: Bell, color: 'text-red-600 bg-red-50' },
                  ]}
                  .map((stat) => (
                    <div key={stat.label} className="card p-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <stat.icon size={20} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 capitalize">{stat.value}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Subscription */}
                {subscription && (
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Plan {subscription.plan}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {subscription.config?.maxContacts === Infinity ? 'Ilimitado' : `${subscription.contacts_used} / ${subscription.config?.maxContacts}`} contactos usados
                        </p>
                      </div>
                      <Link href="/suscripcion" className="btn-secondary text-sm">Cambiar plan</Link>
                    </div>
                    {subscription.config?.maxContacts !== Infinity && (
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.min((subscription.contacts_used / subscription.config.maxContacts) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Recent requests for teacher */}
                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Bell size={18} className="text-red-500" /> Solicitudes pendientes
                    </h3>
                    <div className="space-y-3">
                      {pendingRequests.slice(0, 3).map((req) => (
                        <div key={req.id} className="card p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 font-semibold">{req.student_name?.[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{req.student_name}</p>
                              <p className="text-xs text-gray-500">{req.subject} · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: es })}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(req.id)}
                              disabled={processingId === req.id}
                              className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            >
                              <Check size={14} /> Aceptar
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={processingId === req.id}
                              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            >
                              <X size={14} /> Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                <h2 className="font-bold text-gray-900 text-lg">
                  {user.role === 'teacher' ? 'Solicitudes recibidas' : 'Mis solicitudes'}
                </h2>
                {requests.length === 0 ? (
                  <div className="card p-12 text-center text-gray-400">
                    <Bell size={40} className="mx-auto mb-3 opacity-40" />
                    <p>No hay solicitudes todavía</p>
                    {user.role === 'student' && (
                      <Link href="/buscar" className="btn-primary inline-block mt-4 text-sm">Buscar profesores</Link>
                    )}
                  </div>
                ) : requests.map((req) => (
                  <div key={req.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-semibold text-sm">
                            {(user.role === 'teacher' ? req.student_name : req.teacher_name)?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.role === 'teacher' ? req.student_name : req.teacher_name}
                          </p>
                          <p className="text-sm text-gray-500">{req.announcement_title}</p>
                          {req.message && <p className="text-sm text-gray-600 mt-1 italic">"{req.message}"</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`badge text-xs ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : req.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {req.status === 'pending' ? 'Pendiente' : req.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                        </span>
                        {req.status === 'pending' && user.role === 'teacher' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleAccept(req.id)} disabled={processingId === req.id} className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                              <Check size={12} /> Aceptar
                            </button>
                            <button onClick={() => handleReject(req.id)} disabled={processingId === req.id} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                              <X size={12} /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHATS */}
            {activeTab === 'chats' && (
              <div className="space-y-3">
                <h2 className="font-bold text-gray-900 text-lg">Mis conversaciones</h2>
                {chatList.length === 0 ? (
                  <div className="card p-12 text-center text-gray-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
                    <p>No hay conversaciones activas</p>
                  </div>
                ) : chatList.map((chat) => {
                  const otherName = user.role === 'teacher' ? chat.student_name : chat.teacher_name;
                  const otherAvatar = user.role === 'teacher' ? chat.student_avatar : chat.teacher_avatar;
                  return (
                    <Link key={chat.id} href={`/chats/${chat.id}`} className="card p-4 flex items-center gap-3 hover:border-blue-200 transition-all">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {otherAvatar ? <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" /> : (
                          <span className="text-white font-semibold">{otherName?.[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{otherName}</p>
                          {chat.last_message_at && (
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true, locale: es })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{chat.last_message || 'Nueva conversación'}</p>
                      </div>
                      {parseInt(chat.unread_count) > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                          {chat.unread_count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ANNOUNCEMENTS (teacher only) */}
            {activeTab === 'announcements' && user.role === 'teacher' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 text-lg">Mis anuncios</h2>
                  <Link href="/dar-clases" className="btn-primary text-sm flex items-center gap-1">
                    <Plus size={15} /> Nuevo
                  </Link>
                </div>
                {announcements.length === 0 ? (
                  <div className="card p-12 text-center text-gray-400">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Todavía no publicaste ningún anuncio</p>
                    <Link href="/dar-clases" className="btn-primary inline-block mt-4 text-sm">Publicar anuncio</Link>
                  </div>
                ) : announcements.map((ann) => (
                  <div key={ann.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge text-xs ${ann.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {ann.is_active ? 'Activo' : 'Pausado'}
                          </span>
                          <span className="badge bg-blue-50 text-blue-700 text-xs">{ann.subject}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ann.description}</p>
                        <p className="text-blue-600 font-bold mt-2">${Number(ann.price).toLocaleString('es-AR')}/{ann.price_type === 'hour' ? 'h' : ann.price_type === 'class' ? 'clase' : 'mes'}</p>
                        <p className="text-xs text-gray-400 mt-1">{ann.views} vistas</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAnnouncement(ann)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium text-gray-600">
                          {ann.is_active ? 'Pausar' : 'Activar'}
                        </button>
                        <button onClick={() => deleteAnnouncement(ann.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 font-medium text-red-600">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PROFILE (teacher only) */}
            {activeTab === 'profile' && user.role === 'teacher' && (
              <TeacherProfileEditor profile={profile} onSaved={loadData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TeacherProfileEditor({ profile, onSaved }) {
  const [form, setForm] = useState({
    bio: profile?.bio || '',
    experience: profile?.experience || '',
    subjects: profile?.subjects?.join(', ') || '',
    aptitudes: profile?.aptitudes?.join(', ') || '',
    city: profile?.city || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await teachersApi.updateProfile({
        bio: form.bio,
        experience: form.experience,
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        aptitudes: form.aptitudes.split(',').map((a) => a.trim()).filter(Boolean),
        city: form.city,
      });
      toast.success('Perfil actualizado');
      onSaved();
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card p-6 space-y-5">
      <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Settings size={20} /> Editar perfil</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sobre mí</label>
        <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input-field resize-none" placeholder="Contá quién sos, tu formación, tu enfoque pedagógico..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Experiencia</label>
        <textarea rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="input-field resize-none" placeholder="Años de experiencia, instituciones, logros..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Materias (separadas por coma)</label>
          <input value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} className="input-field" placeholder="Matemática, Física, Cálculo" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" placeholder="Buenos Aires" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Aptitudes (separadas por coma)</label>
        <input value={form.aptitudes} onChange={(e) => setForm({ ...form, aptitudes: e.target.value })} className="input-field" placeholder="Paciencia, Material didáctico, Clases personalizadas" />
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
    </div>
  );
}

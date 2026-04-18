'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { chats as chatsApi, reviews as reviewsApi } from '../../../lib/api';
import StarRating from '../../../components/StarRating';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Send, ArrowLeft, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

let socket = null;

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadChat();
    initSocket();
    return () => { socket?.disconnect(); };
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      const { data } = await chatsApi.getById(id);
      setChat(data.chat);
      setMessages(data.messages);
    } catch {
      toast.error('No se pudo cargar el chat');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initSocket = () => {
    if (!token) return;
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token },
    });
    socket.emit('join_chat', { chatId: id });
    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('user_typing', ({ name }) => {
      setOtherTyping(true);
    });
    socket.on('user_stop_typing', () => {
      setOtherTyping(false);
    });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { chatId: id, content: input.trim() });
    setInput('');
    handleStopTyping();
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { chatId: id });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(handleStopTyping, 1500);
  };

  const handleStopTyping = () => {
    setTyping(false);
    socket?.emit('stop_typing', { chatId: id });
    clearTimeout(typingTimer.current);
  };

  const submitReview = async () => {
    if (!reviewData.rating) { toast.error('Seleccioná una puntuación'); return; }
    setSubmittingReview(true);
    try {
      const teacherId = user.role === 'student' ? chat.teacher_id : chat.student_id;
      await reviewsApi.create({ teacherId, chatId: id, rating: reviewData.rating, comment: reviewData.comment });
      toast.success('¡Reseña enviada!');
      setReviewModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al enviar reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const otherName = user.role === 'teacher' ? chat?.student_name : chat?.teacher_name;
  const otherAvatar = user.role === 'teacher' ? chat?.student_avatar : chat?.teacher_avatar;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherAvatar ? <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" /> : (
            <span className="text-white font-semibold">{otherName?.[0]}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{otherName}</p>
          <p className="text-xs text-gray-400">{chat?.subject}</p>
        </div>
        {user.role === 'student' && (
          <button onClick={() => setReviewModal(true)} className="flex items-center gap-1.5 text-sm text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
            <Star size={15} /> Calificar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-5xl mb-3">👋</div>
            <p className="font-medium">¡Empezá la conversación!</p>
            <p className="text-sm mt-1">Coordiná la clase con {otherName}</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user.id;
          const showDate = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-xs text-gray-400 my-3">
                  {format(new Date(msg.created_at), "d 'de' MMMM", { locale: es })}
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={`Mensaje a ${otherName}...`}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setReviewModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Calificar a {otherName}</h3>
            <p className="text-gray-500 text-sm mb-5">¿Cómo fue tu experiencia?</p>
            <div className="flex justify-center mb-5">
              <StarRating value={reviewData.rating} onChange={(r) => setReviewData({ ...reviewData, rating: r })} size={36} />
            </div>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              placeholder="Contá tu experiencia (opcional)"
              rows={3}
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={submitReview} disabled={submittingReview || !reviewData.rating} className="btn-primary flex-1">
                {submittingReview ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

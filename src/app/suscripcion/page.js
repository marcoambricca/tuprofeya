'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { subscriptions as subscriptionsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { Check, Star, Zap, Crown } from 'lucide-react';

const PLAN_ICONS = { basic: Star, initial: Star, pro: Zap, premium: Zap, max: Crown };
const PLAN_COLORS = {
  basic: 'border-gray-200',
  initial: 'border-gray-200',
  pro: 'border-blue-600 ring-2 ring-blue-600',
  premium: 'border-blue-600 ring-2 ring-blue-600',
  max: 'border-amber-400 ring-2 ring-amber-400',
};
const PLAN_HEADER = {
  basic: 'bg-gray-50',
  initial: 'bg-gray-50',
  pro: 'bg-blue-600 text-white',
  premium: 'bg-blue-600 text-white',
  max: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
};

export default function SuscripcionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState(null);
  const [currentSub, setCurrentSub] = useState(null);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    subscriptionsApi.plans().then((r) => setPlans(r.data));
    if (user) subscriptionsApi.mine().then((r) => setCurrentSub(r.data));
  }, [user]);

  const handleSubscribe = async (planId) => {
    if (!user) { window.location.href = '/auth/register'; return; }
    setSubscribing(planId);
    try {
      await subscriptionsApi.subscribe(planId);
      const updated = await subscriptionsApi.mine();
      setCurrentSub(updated.data);
      toast.success(`Plan ${planId} activado`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar plan');
    } finally {
      setSubscribing(null);
    }
  };

  const userPlans = user?.role === 'teacher' ? plans?.teacher : plans?.student;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Planes y suscripciones</h1>
          <p className="text-gray-500 text-lg">
            {user?.role === 'teacher'
              ? 'Elegí el plan que mejor se adapte a tu actividad docente'
              : 'Accedé a más profesores con nuestros planes premium'}
          </p>
          {currentSub && (
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mt-4">
              <Check size={15} /> Plan actual: <strong className="capitalize">{currentSub.plan}</strong>
            </div>
          )}
        </div>

        {/* Toggle for non-logged in users */}
        {!user && (
          <div className="flex justify-center mb-10">
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
              <button className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm">Para alumnos</button>
              <button className="px-6 py-2 rounded-lg text-gray-500 font-medium text-sm hover:bg-gray-50">Para profesores</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {(userPlans || (user?.role === 'student' ? plans?.student : plans?.teacher) || plans?.student || []).map((plan) => {
            const Icon = PLAN_ICONS[plan.id] || Star;
            const isCurrent = currentSub?.plan === plan.id;
            return (
              <div key={plan.id} className={`bg-white rounded-2xl border-2 overflow-hidden ${PLAN_COLORS[plan.id]} relative`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1">
                    MÁS POPULAR
                  </div>
                )}
                <div className={`p-6 ${PLAN_HEADER[plan.id]} ${plan.popular ? 'pt-8' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={20} />
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold">
                      {plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-AR')}`}
                    </span>
                    {plan.price > 0 && <span className={`text-sm mb-1 ${['pro', 'premium', 'max'].includes(plan.id) ? 'opacity-80' : 'text-gray-400'}`}>/mes</span>}
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="w-full py-3 text-center bg-gray-100 text-gray-600 rounded-xl font-medium text-sm">
                      Plan actual
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                        ['pro', 'premium'].includes(plan.id)
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : plan.id === 'max'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          : 'border-2 border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {subscribing === plan.id ? 'Activando...' : plan.price === 0 ? 'Activar gratis' : 'Suscribirse'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show both plan types if not logged in */}
        {!user && plans && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Para profesores</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.teacher.map((plan) => {
                const Icon = PLAN_ICONS[plan.id] || Star;
                return (
                  <div key={plan.id} className={`bg-white rounded-2xl border-2 overflow-hidden ${PLAN_COLORS[plan.id]} relative`}>
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold text-center py-1">
                        MÁS POPULAR
                      </div>
                    )}
                    <div className={`p-6 ${PLAN_HEADER[plan.id]} ${plan.popular ? 'pt-8' : ''}`}>
                      <div className="flex items-center gap-2 mb-2"><Icon size={20} /><h3 className="text-xl font-bold">{plan.name}</h3></div>
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-extrabold">{plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-AR')}`}</span>
                        {plan.price > 0 && <span className="text-sm mb-1 opacity-80">/mes</span>}
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => window.location.href = `/auth/register?role=teacher`}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${['pro'].includes(plan.id) ? 'bg-blue-600 text-white' : plan.id === 'max' ? 'bg-amber-500 text-white' : 'border-2 border-gray-200 text-gray-700'}`}
                      >
                        Empezar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

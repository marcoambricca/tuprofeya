const router = require('express').Router();
const { authenticate, requireVerified } = require('../middleware/auth.middleware');
const subscriptionRepo = require('../repositories/subscription.repository');
const subscriptionService = require('../services/subscription.service');

const TEACHER_PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 0,
    features: ['1 anuncio activo', '3 alumnos por período', 'Visibilidad estándar'],
    color: 'gray',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2999,
    features: ['3 anuncios activos', '10 alumnos por período', '50% más de visibilidad', 'Badge verificado'],
    color: 'blue',
    popular: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: 5999,
    features: ['Anuncios ilimitados', 'Alumnos ilimitados', 'Máxima visibilidad', 'Top en búsquedas', 'Badge premium'],
    color: 'gold',
  },
];

const STUDENT_PLANS = [
  {
    id: 'initial',
    name: 'Inicial',
    price: 0,
    features: ['5 solicitudes por período', 'Acceso al chat', 'Historial de clases'],
    color: 'gray',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    features: ['Solicitudes ilimitadas', 'Acceso prioritario', 'Historial completo', 'Soporte prioritario'],
    color: 'blue',
    popular: true,
  },
];

// GET /subscriptions/plans
router.get('/plans', (req, res) => {
  res.json({ teacher: TEACHER_PLANS, student: STUDENT_PLANS });
});

// GET /subscriptions/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const sub = await subscriptionService.getMySubscription(req.user.id);
    res.json(sub);
  } catch (err) {
    console.error('[GET /subscriptions/me]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// POST /subscriptions/subscribe
router.post('/subscribe', authenticate, requireVerified, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: 'Plan requerido' });

    const config = subscriptionRepo.getPlanConfig(plan);
    if (!config) return res.status(400).json({ message: 'Plan inválido' });

    // Validate plan matches user role
    const teacherPlans = ['basic', 'pro', 'max'];
    const studentPlans = ['initial', 'premium'];
    if (req.user.role === 'teacher' && !teacherPlans.includes(plan)) {
      return res.status(400).json({ message: 'Plan no disponible para profesores' });
    }
    if (req.user.role === 'student' && !studentPlans.includes(plan)) {
      return res.status(400).json({ message: 'Plan no disponible para alumnos' });
    }

    const sub = await subscriptionRepo.create(req.user.id, plan);
    res.json(sub);
  } catch (err) {
    console.error('[POST /subscriptions/subscribe]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

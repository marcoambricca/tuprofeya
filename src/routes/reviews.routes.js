const router = require('express').Router();
const { authenticate, requireVerified } = require('../middleware/auth.middleware');
const reviewRepo = require('../repositories/review.repository');
const chatRepo = require('../repositories/chat.repository');

// POST /reviews — student reviews teacher after chat
router.post('/', authenticate, requireVerified, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Solo alumnos pueden dejar reseñas' });

    const { teacherId, chatId, rating, comment } = req.body;
    if (!teacherId || !chatId || !rating) return res.status(400).json({ message: 'Faltan campos requeridos' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating debe ser entre 1 y 5' });

    const hasAccess = await chatRepo.hasAccess(chatId, req.user.id);
    if (!hasAccess) return res.status(403).json({ message: 'No tenés acceso a ese chat' });

    const exists = await reviewRepo.exists(req.user.id, teacherId, chatId);
    if (exists) return res.status(409).json({ message: 'Ya dejaste una reseña para este profesor' });

    const review = await reviewRepo.create(req.user.id, teacherId, chatId, rating, comment);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /reviews/teacher/:userId
router.get('/teacher/:userId', async (req, res) => {
  try {
    const [reviews, stats] = await Promise.all([
      reviewRepo.findByTeacher(req.params.userId, parseInt(req.query.limit) || 20, parseInt(req.query.offset) || 0),
      reviewRepo.getStats(req.params.userId),
    ]);
    res.json({ reviews, stats });
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /reviews/landing — latest reviews for landing page
router.get('/landing', async (req, res) => {
  try {
    const reviews = await reviewRepo.getLatestForLanding(6);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

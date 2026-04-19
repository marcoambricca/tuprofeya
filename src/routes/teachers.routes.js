const router = require('express').Router();
const { authenticate, requireVerified, requireRole } = require('../middleware/auth.middleware');
const teacherRepo = require('../repositories/teacher.repository');
const announcementRepo = require('../repositories/announcement.repository');
const reviewRepo = require('../repositories/review.repository');
const subscriptionRepo = require('../repositories/subscription.repository');
const { query } = require('../config/database');

// GET /teachers/featured — for landing page
router.get('/featured', async (req, res) => {
  try {
    const result = await query(`
      SELECT tp.id, u.name, u.avatar_url, tp.subjects, tp.city,
        COALESCE(AVG(r.rating), 0)::NUMERIC(3,1) AS avg_rating,
        COUNT(DISTINCT r.id) AS review_count,
        tp.total_students,
        COALESCE(s.plan, 'basic') AS subscription_plan,
        (SELECT title FROM announcements WHERE teacher_id = tp.id AND is_active = TRUE LIMIT 1) AS main_announcement,
        (SELECT price FROM announcements WHERE teacher_id = tp.id AND is_active = TRUE LIMIT 1) AS price
      FROM teacher_profiles tp
      JOIN users u ON u.id = tp.user_id
      LEFT JOIN reviews r ON r.teacher_id = tp.user_id
      LEFT JOIN subscriptions s ON s.user_id = tp.user_id AND s.status = 'active'
      WHERE EXISTS (SELECT 1 FROM announcements WHERE teacher_id = tp.id AND is_active = TRUE)
      GROUP BY tp.id, u.name, u.avatar_url, tp.subjects, tp.city, tp.total_students, s.plan
      ORDER BY
        CASE COALESCE(s.plan, 'basic') WHEN 'max' THEN 1 WHEN 'pro' THEN 2 ELSE 3 END,
        avg_rating DESC
      LIMIT 8
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /teachers/featured]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /teachers/:id — public teacher profile
router.get('/:id', async (req, res) => {
  try {
    const profile = await teacherRepo.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Perfil no encontrado' });

    const [announcements, reviews, stats, certs] = await Promise.all([
      announcementRepo.findByTeacherId(profile.id),
      reviewRepo.findByTeacher(profile.user_id, 5),
      reviewRepo.getStats(profile.user_id),
      teacherRepo.getCertificates(profile.id),
    ]);

    res.json({ profile, announcements, reviews, stats, certificates: certs });
  } catch (err) {
    console.error('[GET /teachers/:id]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /teachers/me/profile — own profile
router.get('/me/profile', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const profile = await teacherRepo.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Perfil no encontrado' });

    const [announcements, certs, sub] = await Promise.all([
      announcementRepo.findByTeacherId(profile.id),
      teacherRepo.getCertificates(profile.id),
      subscriptionRepo.findActive(req.user.id),
    ]);

    res.json({ profile, announcements, certificates: certs, subscription: sub });
  } catch (err) {
    console.error('[GET /teachers/me/profile]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /teachers/me/profile
router.put('/me/profile', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const updated = await teacherRepo.update(req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('[PUT /teachers/me/profile]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

const router = require('express').Router();
const { authenticate, requireVerified, requireRole } = require('../middleware/auth.middleware');
const announcementRepo = require('../repositories/announcement.repository');
const teacherRepo = require('../repositories/teacher.repository');
const subscriptionService = require('../services/subscription.service');

// GET /announcements/search
router.get('/search', async (req, res) => {
  try {
    const { q, minPrice, maxPrice, level, modality } = req.query;
    const results = await announcementRepo.search({
      subject: q,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      level,
      modality,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
    });
    res.json(results);
  } catch (err) {
    console.error('[GET /announcements/search]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /announcements/:id
router.get('/:id', async (req, res) => {
  try {
    const announcement = await announcementRepo.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Anuncio no encontrado' });
    await announcementRepo.incrementViews(req.params.id);
    res.json(announcement);
  } catch (err) {
    console.error('[GET /announcements/:id]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// POST /announcements — create
router.post('/', authenticate, requireVerified, requireRole('teacher'), async (req, res) => {
  try {
    const profile = await teacherRepo.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Perfil de docente no encontrado' });

    const canPublish = await subscriptionService.canTeacherPublish(req.user.id, profile.id);
    if (!canPublish.allowed) return res.status(403).json({ message: canPublish.reason });

    const announcement = await announcementRepo.create(profile.id, req.body);
    res.status(201).json(announcement);
  } catch (err) {
    console.error('[POST /announcements]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /announcements/:id
router.put('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const profile = await teacherRepo.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Perfil no encontrado' });

    const updated = await announcementRepo.update(req.params.id, profile.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Anuncio no encontrado' });
    res.json(updated);
  } catch (err) {
    console.error('[PUT /announcements/:id]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// DELETE /announcements/:id
router.delete('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const profile = await teacherRepo.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Perfil no encontrado' });

    await announcementRepo.remove(req.params.id, profile.id);
    res.json({ message: 'Anuncio eliminado' });
  } catch (err) {
    console.error('[DELETE /announcements/:id]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

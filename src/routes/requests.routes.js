const router = require('express').Router();
const { authenticate, requireVerified } = require('../middleware/auth.middleware');
const requestRepo = require('../repositories/request.repository');
const chatRepo = require('../repositories/chat.repository');
const teacherRepo = require('../repositories/teacher.repository');
const announcementRepo = require('../repositories/announcement.repository');
const subscriptionService = require('../services/subscription.service');
const subscriptionRepo = require('../repositories/subscription.repository');
const emailService = require('../services/email.service');
const userRepo = require('../repositories/user.repository');

// POST /requests — student sends request to teacher
router.post('/', authenticate, requireVerified, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Solo alumnos pueden solicitar profesores' });

    const { announcementId, message } = req.body;
    if (!announcementId) return res.status(400).json({ message: 'announcementId requerido' });

    const announcement = await announcementRepo.findById(announcementId);
    if (!announcement) return res.status(404).json({ message: 'Anuncio no encontrado' });

    // announcement.findById returns teacher user_id via JOIN on teacher_profiles
    const { query: dbQuery } = require('../config/database');
    const tpResult = await dbQuery('SELECT user_id FROM teacher_profiles WHERE id = $1', [announcement.teacher_id]);
    const teacherUserId = tpResult.rows[0]?.user_id;

    if (teacherUserId === req.user.id) return res.status(400).json({ message: 'No podés solicitarte a vos mismo' });

    const alreadyPending = await requestRepo.existsPending(req.user.id, teacherUserId);
    if (alreadyPending) return res.status(409).json({ message: 'Ya tenés una solicitud pendiente con este profesor' });

    const canContact = await subscriptionService.canStudentContact(req.user.id);
    if (!canContact.allowed) return res.status(403).json({ message: canContact.reason });

    const request = await requestRepo.create(req.user.id, teacherUserId, announcementId, message);
    await subscriptionRepo.incrementContacts(req.user.id);

    // Notify teacher
    const teacher = await userRepo.findById(teacherUserId);
    if (teacher) {
      emailService.sendRequestNotification(teacher.email, teacher.name, req.user.name, announcement.subject, message).catch(err =>
        console.error('[POST /requests] Error enviando notificacion al profesor:', err)
      );
    }

    res.status(201).json(request);
  } catch (err) {
    console.error('[POST /requests]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /requests — list (teacher sees received, student sees sent)
router.get('/', authenticate, async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'teacher') {
      requests = await requestRepo.findByTeacher(req.user.id, req.query.status);
    } else {
      requests = await requestRepo.findByStudent(req.user.id);
    }
    res.json(requests);
  } catch (err) {
    console.error('[GET /requests]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /requests/:id/accept — teacher accepts
router.put('/:id/accept', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Solo profesores pueden aceptar solicitudes' });

    const request = await requestRepo.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (request.teacher_id !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'La solicitud ya fue procesada' });

    const canAccept = await subscriptionService.canTeacherAccept(req.user.id);
    if (!canAccept.allowed) return res.status(403).json({ message: canAccept.reason });

    await requestRepo.updateStatus(req.params.id, 'accepted');
    const chat = await chatRepo.create(req.params.id, request.student_id, request.teacher_id);
    await teacherRepo.incrementStudentCount(req.user.id);

    // Notify student
    const student = await userRepo.findById(request.student_id);
    if (student) {
      emailService.sendRequestAccepted(student.email, student.name, req.user.name).catch(err =>
        console.error('[PUT /requests/:id/accept] Error enviando notificacion al alumno:', err)
      );
    }

    res.json({ request: { ...request, status: 'accepted' }, chat });
  } catch (err) {
    console.error('[PUT /requests/:id/accept]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /requests/:id/reject — teacher rejects
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Solo profesores pueden rechazar solicitudes' });

    const request = await requestRepo.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (request.teacher_id !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'La solicitud ya fue procesada' });

    await requestRepo.updateStatus(req.params.id, 'rejected');
    res.json({ message: 'Solicitud rechazada' });
  } catch (err) {
    console.error('[PUT /requests/:id/reject]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

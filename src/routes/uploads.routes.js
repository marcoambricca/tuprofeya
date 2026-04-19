const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const s3Service = require('../services/s3.service');
const userRepo = require('../repositories/user.repository');
const teacherRepo = require('../repositories/teacher.repository');

// POST /uploads/avatar
router.post('/avatar', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

    const { url } = await s3Service.uploadAvatar(req.file.buffer, req.file.originalname, req.file.mimetype);
    await userRepo.updateAvatar(req.user.id, url);
    res.json({ url });
  } catch (err) {
    console.error('[POST /uploads/avatar]', err);
    res.status(500).json({ message: 'Error al subir imagen' });
  }
});

// POST /uploads/certificate
router.post('/certificate', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Solo profesores pueden subir certificados' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre del certificado es requerido' });

    const profile = await teacherRepo.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Perfil de docente no encontrado' });

    const { url } = await s3Service.uploadCertificate(req.file.buffer, req.file.originalname, req.file.mimetype);
    const cert = await teacherRepo.addCertificate(profile.id, name, url);
    res.status(201).json(cert);
  } catch (err) {
    console.error('[POST /uploads/certificate]', err);
    res.status(500).json({ message: 'Error al subir certificado' });
  }
});

// DELETE /uploads/certificate/:id
router.delete('/certificate/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'No autorizado' });

    const profile = await teacherRepo.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ message: 'Perfil no encontrado' });

    await teacherRepo.deleteCertificate(req.params.id, profile.id);
    res.json({ message: 'Certificado eliminado' });
  } catch (err) {
    console.error('[DELETE /uploads/certificate/:id]', err);
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// POST /auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role').isIn(['student', 'teacher']).withMessage('Rol inválido'),
  validate,
], async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Error interno' });
  }
});

// POST /auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Error interno' });
  }
});

// POST /auth/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    await authService.verifyEmail(req.user.id, req.body.code);
    res.json({ message: 'Email verificado correctamente' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// POST /auth/resend-verification
router.post('/resend-verification', authenticate, async (req, res) => {
  try {
    await authService.resendVerification(req.user.id);
    res.json({ message: 'Código reenviado' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// GET /auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

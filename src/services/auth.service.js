const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repository');
const teacherRepo = require('../repositories/teacher.repository');
const subscriptionRepo = require('../repositories/subscription.repository');
const emailService = require('./email.service');

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async ({ name, email, password, role, teacherData }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw { status: 409, message: 'Ya existe una cuenta con ese email' };

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userRepo.create({ name, email, passwordHash, role });

  if (role === 'teacher') {
    const profile = await teacherRepo.create(user.id, teacherData || {});
    await subscriptionRepo.create(user.id, 'basic');
    user.profileId = profile.id;
  } else {
    await subscriptionRepo.create(user.id, 'initial');
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await userRepo.createVerificationCode(user.id, code, expiresAt);
  emailService.sendVerificationEmail(email, name, code).catch(err =>
    console.error('[auth.service] Error enviando email de verificacion:', err)
  );

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw { status: 401, message: 'Email o contraseña incorrectos' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Email o contraseña incorrectos' };

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
};

const verifyEmail = async (userId, code) => {
  const record = await userRepo.findVerificationCode(userId, code);
  if (!record) throw { status: 400, message: 'Código inválido o expirado' };

  await userRepo.markVerificationCodeUsed(record.id);
  await userRepo.setVerified(userId);
};

const resendVerification = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };
  if (user.is_verified) throw { status: 400, message: 'La cuenta ya está verificada' };

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await userRepo.createVerificationCode(userId, code, expiresAt);
  await emailService.sendVerificationEmail(user.email, user.name, code);
};

module.exports = { register, login, verifyEmail, resendVerification };

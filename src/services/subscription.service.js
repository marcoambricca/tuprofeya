const subscriptionRepo = require('../repositories/subscription.repository');
const requestRepo = require('../repositories/request.repository');
const announcementRepo = require('../repositories/announcement.repository');

const canStudentContact = async (userId) => {
  const sub = await subscriptionRepo.findActive(userId);
  if (!sub) return { allowed: false, reason: 'Sin suscripción activa' };

  const config = subscriptionRepo.getPlanConfig(sub.plan);
  if (config.maxContacts === Infinity) return { allowed: true };

  const used = await requestRepo.countByStudentInPeriod(userId, sub.period_start);
  if (used >= config.maxContacts) {
    return { allowed: false, reason: `Alcanzaste el límite de ${config.maxContacts} solicitudes de tu plan ${sub.plan}` };
  }
  return { allowed: true, remaining: config.maxContacts - used };
};

const canTeacherAccept = async (userId) => {
  const sub = await subscriptionRepo.findActive(userId);
  if (!sub) return { allowed: false, reason: 'Sin suscripción activa' };

  const config = subscriptionRepo.getPlanConfig(sub.plan);
  if (config.maxContacts === Infinity) return { allowed: true };

  const accepted = await requestRepo.countAcceptedByTeacherInPeriod(userId, sub.period_start);
  if (accepted >= config.maxContacts) {
    return { allowed: false, reason: `Alcanzaste el límite de ${config.maxContacts} alumnos de tu plan ${sub.plan}` };
  }
  return { allowed: true, remaining: config.maxContacts - accepted };
};

const canTeacherPublish = async (userId, teacherProfileId) => {
  const sub = await subscriptionRepo.findActive(userId);
  const plan = sub ? sub.plan : 'basic';
  const config = subscriptionRepo.getPlanConfig(plan);

  if (config.maxAnnouncements === Infinity) return { allowed: true };

  const active = await announcementRepo.countActiveByTeacherId(teacherProfileId);
  if (active >= config.maxAnnouncements) {
    return { allowed: false, reason: `Tu plan ${plan} permite máximo ${config.maxAnnouncements} anuncio(s) activo(s)` };
  }
  return { allowed: true, remaining: config.maxAnnouncements - active };
};

const getMySubscription = async (userId) => {
  const sub = await subscriptionRepo.findActive(userId);
  if (!sub) return null;
  const config = subscriptionRepo.getPlanConfig(sub.plan);
  return { ...sub, config };
};

module.exports = { canStudentContact, canTeacherAccept, canTeacherPublish, getMySubscription };

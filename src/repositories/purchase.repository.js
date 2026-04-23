const { query } = require('../config/database');

const getUserById = async (userId) => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) throw new Error('USER_NOT_FOUND');
  return result.rows[0];
};

const getSubscriptionByUserId = async (userId) => {
  const result = await query(
    `SELECT s.*, p.nombre, p.cant_anuncios, p.cant_alumnos, p.visibilidad
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = $1 AND s.status = 'active'
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );
  if (!result.rows[0]) throw new Error('SUBSCRIPTION_NOT_FOUND');
  return result.rows[0];
};

const getSubscriptionIdByUserId = async (userId) => {
  const result = await query(
    `SELECT subscription_id FROM subscriptions 
     WHERE user_id = $1 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  if (!result.rows[0]) throw new Error('SUBSCRIPTION_NOT_FOUND');
  return result.rows[0].subscription_id;
};

// APLICAR PLAN (COMPRA)
const updateUserPlanAndPaymentById = async (userId, planId, lemonSubscriptionId) => {
  await query(
    `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const result = await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, period_start, period_end, contacts_used, subscription_id)
     VALUES ($1, $2, 'active', NOW(), $3, 0, $4)
     RETURNING *`,
    [userId, planId, periodEnd, lemonSubscriptionId]
  );

  return result.rows[0];
};

// RESET DE PERIODO (renovación)
const resetLastPayment = async (userId) => {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const result = await query(
    `UPDATE subscriptions 
     SET period_start = NOW(), period_end = $2, contacts_used = 0
     WHERE user_id = $1 AND status = 'active'
     RETURNING *`,
    [userId, periodEnd]
  );
  return result.rows[0];
};

// CANCELAR (marca cancelled pero sigue activa hasta fin de periodo)
const cancelPlan = async (userId) => {
  const result = await query(
    `UPDATE subscriptions SET status = 'cancelled'
     WHERE user_id = $1 AND status = 'active'
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

// EXPIRACIÓN → volver a Basico (plan id = 1)
const setUserFreePlanById = async (userId) => {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const result = await query(
    `INSERT INTO subscriptions (user_id, plan_id, status, period_start, period_end, contacts_used)
     VALUES ($1, 1, 'active', NOW(), $2, 0)
     RETURNING *`,
    [userId, periodEnd]
  );
  return result.rows[0];
};

// INCREMENTAR USO DE CONTACTOS
const incrementContactsUsed = async (userId) => {
  const result = await query(
    `UPDATE subscriptions SET contacts_used = contacts_used + 1
     WHERE user_id = $1 AND status = 'active'
     RETURNING contacts_used`,
    [userId]
  );
  return result.rows[0];
};

module.exports = {
  getUserById,
  getSubscriptionByUserId,
  getSubscriptionIdByUserId,
  updateUserPlanAndPaymentById,
  resetLastPayment,
  cancelPlan,
  setUserFreePlanById,
  incrementContactsUsed,
};
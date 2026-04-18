const { query } = require('../config/database');

const PLANS = {
  // Teacher plans
  basic: { maxAnnouncements: 1, maxContacts: 3, visibilityScore: 20, price: 0, durationDays: 30 },
  pro: { maxAnnouncements: 3, maxContacts: 10, visibilityScore: 60, price: 2999, durationDays: 30 },
  max: { maxAnnouncements: Infinity, maxContacts: Infinity, visibilityScore: 100, price: 5999, durationDays: 30 },
  // Student plans
  initial: { maxContacts: 5, price: 0, durationDays: 30 },
  premium: { maxContacts: Infinity, price: 1999, durationDays: 30 },
};

const findActive = async (userId) => {
  const result = await query(
    `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' AND period_end > NOW() ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

const create = async (userId, plan) => {
  const planConfig = PLANS[plan];
  if (!planConfig) throw new Error('Plan inválido');

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + planConfig.durationDays);

  // Cancel existing active
  await query(
    `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );

  const result = await query(
    `INSERT INTO subscriptions (user_id, plan, period_end) VALUES ($1, $2, $3) RETURNING *`,
    [userId, plan, periodEnd]
  );
  return result.rows[0];
};

const getPlanConfig = (plan) => PLANS[plan] || PLANS.basic;

const incrementContacts = async (userId) => {
  await query(
    `UPDATE subscriptions SET contacts_used = contacts_used + 1
     WHERE user_id = $1 AND status = 'active' AND period_end > NOW()`,
    [userId]
  );
};

module.exports = { findActive, create, getPlanConfig, incrementContacts, PLANS };

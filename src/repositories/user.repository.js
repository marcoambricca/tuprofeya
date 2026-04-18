const { query } = require('../config/database');

const findByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query('SELECT id, name, email, role, is_verified, avatar_url, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const create = async ({ name, email, passwordHash, role }) => {
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, is_verified',
    [name, email, passwordHash, role]
  );
  return result.rows[0];
};

const updateAvatar = async (userId, avatarUrl) => {
  const result = await query(
    'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, avatar_url',
    [avatarUrl, userId]
  );
  return result.rows[0];
};

const setVerified = async (userId) => {
  await query('UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
};

const createVerificationCode = async (userId, code, expiresAt) => {
  await query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
  await query(
    'INSERT INTO email_verifications (user_id, code, expires_at) VALUES ($1, $2, $3)',
    [userId, code, expiresAt]
  );
};

const findVerificationCode = async (userId, code) => {
  const result = await query(
    'SELECT * FROM email_verifications WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()',
    [userId, code]
  );
  return result.rows[0];
};

const markVerificationCodeUsed = async (id) => {
  await query('UPDATE email_verifications SET used = TRUE WHERE id = $1', [id]);
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateAvatar,
  setVerified,
  createVerificationCode,
  findVerificationCode,
  markVerificationCodeUsed,
};

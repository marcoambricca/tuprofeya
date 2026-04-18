const { query } = require('../config/database');

const findByUserId = async (userId) => {
  const result = await query('SELECT * FROM teacher_profiles WHERE user_id = $1', [userId]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query(`
    SELECT tp.*, u.name, u.email, u.avatar_url,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count,
      s.plan AS subscription_plan
    FROM teacher_profiles tp
    JOIN users u ON u.id = tp.user_id
    LEFT JOIN reviews r ON r.teacher_id = tp.user_id
    LEFT JOIN subscriptions s ON s.user_id = tp.user_id AND s.status = 'active'
    WHERE tp.id = $1
    GROUP BY tp.id, u.name, u.email, u.avatar_url, s.plan
  `, [id]);
  return result.rows[0];
};

const create = async (userId, data = {}) => {
  const result = await query(
    `INSERT INTO teacher_profiles (user_id, bio, experience, subjects, aptitudes, city, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      userId,
      data.bio || null,
      data.experience || null,
      data.subjects || [],
      data.aptitudes || [],
      data.city || null,
      data.country || 'Argentina',
    ]
  );
  return result.rows[0];
};

const update = async (userId, data) => {
  const result = await query(
    `UPDATE teacher_profiles
     SET bio = COALESCE($1, bio),
         experience = COALESCE($2, experience),
         subjects = COALESCE($3, subjects),
         aptitudes = COALESCE($4, aptitudes),
         city = COALESCE($5, city),
         country = COALESCE($6, country),
         updated_at = NOW()
     WHERE user_id = $7 RETURNING *`,
    [data.bio, data.experience, data.subjects, data.aptitudes, data.city, data.country, userId]
  );
  return result.rows[0];
};

const addCertificate = async (teacherId, name, fileUrl) => {
  const result = await query(
    'INSERT INTO teacher_certificates (teacher_id, name, file_url) VALUES ($1, $2, $3) RETURNING *',
    [teacherId, name, fileUrl]
  );
  return result.rows[0];
};

const getCertificates = async (teacherId) => {
  const result = await query('SELECT * FROM teacher_certificates WHERE teacher_id = $1', [teacherId]);
  return result.rows;
};

const deleteCertificate = async (id, teacherId) => {
  await query('DELETE FROM teacher_certificates WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
};

const incrementStudentCount = async (userId) => {
  await query('UPDATE teacher_profiles SET total_students = total_students + 1 WHERE user_id = $1', [userId]);
};

module.exports = {
  findByUserId,
  findById,
  create,
  update,
  addCertificate,
  getCertificates,
  deleteCertificate,
  incrementStudentCount,
};

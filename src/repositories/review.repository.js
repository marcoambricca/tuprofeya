const { query } = require('../config/database');

const create = async (studentId, teacherId, chatId, rating, comment) => {
  const result = await query(
    `INSERT INTO reviews (student_id, teacher_id, chat_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [studentId, teacherId, chatId, rating, comment]
  );
  return result.rows[0];
};

const findByTeacher = async (teacherId, limit = 20, offset = 0) => {
  const result = await query(`
    SELECT r.*, u.name AS student_name, u.avatar_url AS student_avatar
    FROM reviews r
    JOIN users u ON u.id = r.student_id
    WHERE r.teacher_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `, [teacherId, limit, offset]);
  return result.rows;
};

const getStats = async (teacherId) => {
  const result = await query(`
    SELECT
      COALESCE(AVG(rating), 0)::NUMERIC(3,1) AS avg_rating,
      COUNT(*) AS total_reviews,
      COUNT(CASE WHEN rating = 5 THEN 1 END) AS five_star,
      COUNT(CASE WHEN rating = 4 THEN 1 END) AS four_star,
      COUNT(CASE WHEN rating = 3 THEN 1 END) AS three_star,
      COUNT(CASE WHEN rating = 2 THEN 1 END) AS two_star,
      COUNT(CASE WHEN rating = 1 THEN 1 END) AS one_star
    FROM reviews
    WHERE teacher_id = $1
  `, [teacherId]);
  return result.rows[0];
};

const exists = async (studentId, teacherId, chatId) => {
  const result = await query(
    'SELECT id FROM reviews WHERE student_id = $1 AND teacher_id = $2 AND chat_id = $3',
    [studentId, teacherId, chatId]
  );
  return result.rows.length > 0;
};

const getLatestForLanding = async (limit = 6) => {
  const result = await query(`
    SELECT r.*, s.name AS student_name, s.avatar_url AS student_avatar,
      t.name AS teacher_name
    FROM reviews r
    JOIN users s ON s.id = r.student_id
    JOIN users t ON t.id = r.teacher_id
    WHERE r.rating >= 4
    ORDER BY r.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
};

module.exports = {
  create,
  findByTeacher,
  getStats,
  exists,
  getLatestForLanding,
};

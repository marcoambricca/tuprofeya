const { query } = require('../config/database');

const create = async (studentId, teacherId, announcementId, message) => {
  const result = await query(
    `INSERT INTO chat_requests (student_id, teacher_id, announcement_id, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [studentId, teacherId, announcementId, message]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query(`
    SELECT cr.*,
      s.name AS student_name, s.avatar_url AS student_avatar,
      t.name AS teacher_name, t.avatar_url AS teacher_avatar,
      a.title AS announcement_title, a.subject
    FROM chat_requests cr
    JOIN users s ON s.id = cr.student_id
    JOIN users t ON t.id = cr.teacher_id
    LEFT JOIN announcements a ON a.id = cr.announcement_id
    WHERE cr.id = $1
  `, [id]);
  return result.rows[0];
};

const findByTeacher = async (teacherId, status) => {
  let q = `
    SELECT cr.*,
      s.name AS student_name, s.avatar_url AS student_avatar,
      a.title AS announcement_title, a.subject
    FROM chat_requests cr
    JOIN users s ON s.id = cr.student_id
    LEFT JOIN announcements a ON a.id = cr.announcement_id
    WHERE cr.teacher_id = $1
  `;
  const params = [teacherId];
  if (status) { q += ` AND cr.status = $2`; params.push(status); }
  q += ' ORDER BY cr.created_at DESC';
  const result = await query(q, params);
  return result.rows;
};

const findByStudent = async (studentId) => {
  const result = await query(`
    SELECT cr.*,
      t.name AS teacher_name, t.avatar_url AS teacher_avatar,
      a.title AS announcement_title, a.subject
    FROM chat_requests cr
    JOIN users t ON t.id = cr.teacher_id
    LEFT JOIN announcements a ON a.id = cr.announcement_id
    WHERE cr.student_id = $1
    ORDER BY cr.created_at DESC
  `, [studentId]);
  return result.rows;
};

const updateStatus = async (id, status) => {
  const result = await query(
    'UPDATE chat_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

const countByStudentInPeriod = async (studentId, periodStart) => {
  const result = await query(
    'SELECT COUNT(*) FROM chat_requests WHERE student_id = $1 AND created_at >= $2',
    [studentId, periodStart]
  );
  return parseInt(result.rows[0].count);
};

const countAcceptedByTeacherInPeriod = async (teacherId, periodStart) => {
  const result = await query(
    `SELECT COUNT(*) FROM chat_requests
     WHERE teacher_id = $1 AND status = 'accepted' AND updated_at >= $2`,
    [teacherId, periodStart]
  );
  return parseInt(result.rows[0].count);
};

const existsPending = async (studentId, teacherId) => {
  const result = await query(
    `SELECT id FROM chat_requests
     WHERE student_id = $1 AND teacher_id = $2 AND status = 'pending'`,
    [studentId, teacherId]
  );
  return result.rows.length > 0;
};

module.exports = {
  create,
  findById,
  findByTeacher,
  findByStudent,
  updateStatus,
  countByStudentInPeriod,
  countAcceptedByTeacherInPeriod,
  existsPending,
};

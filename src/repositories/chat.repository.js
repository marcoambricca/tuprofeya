const { query } = require('../config/database');

const create = async (requestId, studentId, teacherId) => {
  const result = await query(
    'INSERT INTO chats (request_id, student_id, teacher_id) VALUES ($1, $2, $3) RETURNING *',
    [requestId, studentId, teacherId]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query(`
    SELECT c.*,
      s.name AS student_name, s.avatar_url AS student_avatar,
      t.name AS teacher_name, t.avatar_url AS teacher_avatar,
      cr.announcement_id, a.subject, a.title AS announcement_title
    FROM chats c
    JOIN users s ON s.id = c.student_id
    JOIN users t ON t.id = c.teacher_id
    LEFT JOIN chat_requests cr ON cr.id = c.request_id
    LEFT JOIN announcements a ON a.id = cr.announcement_id
    WHERE c.id = $1
  `, [id]);
  return result.rows[0];
};

const findByUser = async (userId) => {
  const result = await query(`
    SELECT c.*,
      s.name AS student_name, s.avatar_url AS student_avatar,
      t.name AS teacher_name, t.avatar_url AS teacher_avatar,
      (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_read = FALSE AND sender_id != $1) AS unread_count
    FROM chats c
    JOIN users s ON s.id = c.student_id
    JOIN users t ON t.id = c.teacher_id
    WHERE (c.student_id = $1 OR c.teacher_id = $1) AND c.is_active = TRUE
    ORDER BY last_message_at DESC NULLS LAST
  `, [userId]);
  return result.rows;
};

const findByRequestId = async (requestId) => {
  const result = await query('SELECT * FROM chats WHERE request_id = $1', [requestId]);
  return result.rows[0];
};

const getMessages = async (chatId, limit = 50, before) => {
  let q = `
    SELECT m.*, u.name AS sender_name, u.avatar_url AS sender_avatar
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.chat_id = $1
  `;
  const params = [chatId];
  if (before) {
    q += ` AND m.created_at < $2`;
    params.push(before);
  }
  q += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);
  const result = await query(q, params);
  return result.rows.reverse();
};

const addMessage = async (chatId, senderId, content) => {
  const result = await query(
    'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
    [chatId, senderId, content]
  );
  return result.rows[0];
};

const markMessagesRead = async (chatId, userId) => {
  await query(
    'UPDATE messages SET is_read = TRUE WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE',
    [chatId, userId]
  );
};

const hasAccess = async (chatId, userId) => {
  const result = await query(
    'SELECT id FROM chats WHERE id = $1 AND (student_id = $2 OR teacher_id = $2)',
    [chatId, userId]
  );
  return result.rows.length > 0;
};

module.exports = {
  create,
  findById,
  findByUser,
  findByRequestId,
  getMessages,
  addMessage,
  markMessagesRead,
  hasAccess,
};

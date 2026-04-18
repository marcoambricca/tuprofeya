const { query } = require('../config/database');

const findById = async (id) => {
  const result = await query(`
    SELECT a.*, tp.id AS profile_id, u.name AS teacher_name, u.avatar_url,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count,
      s.plan AS subscription_plan
    FROM announcements a
    JOIN teacher_profiles tp ON tp.id = a.teacher_id
    JOIN users u ON u.id = tp.user_id
    LEFT JOIN reviews r ON r.teacher_id = tp.user_id
    LEFT JOIN subscriptions s ON s.user_id = tp.user_id AND s.status = 'active'
    WHERE a.id = $1
    GROUP BY a.id, tp.id, u.name, u.avatar_url, s.plan
  `, [id]);
  return result.rows[0];
};

const findByTeacherId = async (teacherId) => {
  const result = await query(
    'SELECT * FROM announcements WHERE teacher_id = $1 ORDER BY created_at DESC',
    [teacherId]
  );
  return result.rows;
};

const countActiveByTeacherId = async (teacherId) => {
  const result = await query(
    'SELECT COUNT(*) FROM announcements WHERE teacher_id = $1 AND is_active = TRUE',
    [teacherId]
  );
  return parseInt(result.rows[0].count);
};

const create = async (teacherId, data) => {
  const result = await query(
    `INSERT INTO announcements (teacher_id, title, description, subject, price, price_type, level, modality)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [teacherId, data.title, data.description, data.subject, data.price, data.price_type || 'hour', data.level || 'todos', data.modality || 'virtual']
  );
  return result.rows[0];
};

const update = async (id, teacherId, data) => {
  const result = await query(
    `UPDATE announcements
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         subject = COALESCE($3, subject),
         price = COALESCE($4, price),
         price_type = COALESCE($5, price_type),
         level = COALESCE($6, level),
         modality = COALESCE($7, modality),
         is_active = COALESCE($8, is_active),
         updated_at = NOW()
     WHERE id = $9 AND teacher_id = $10 RETURNING *`,
    [data.title, data.description, data.subject, data.price, data.price_type, data.level, data.modality, data.is_active, id, teacherId]
  );
  return result.rows[0];
};

const remove = async (id, teacherId) => {
  await query('DELETE FROM announcements WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
};

const incrementViews = async (id) => {
  await query('UPDATE announcements SET views = views + 1 WHERE id = $1', [id]);
};

const search = async ({ subject, minPrice, maxPrice, level, modality, limit = 20, offset = 0 }) => {
  let conditions = ['a.is_active = TRUE'];
  let params = [];
  let paramCount = 1;

  if (subject) {
    conditions.push(`(LOWER(a.subject) LIKE $${paramCount} OR LOWER(a.title) LIKE $${paramCount})`);
    params.push(`%${subject.toLowerCase()}%`);
    paramCount++;
  }
  if (minPrice != null) {
    conditions.push(`a.price >= $${paramCount}`);
    params.push(minPrice);
    paramCount++;
  }
  if (maxPrice != null) {
    conditions.push(`a.price <= $${paramCount}`);
    params.push(maxPrice);
    paramCount++;
  }
  if (level && level !== 'todos') {
    conditions.push(`(a.level = $${paramCount} OR a.level = 'todos')`);
    params.push(level);
    paramCount++;
  }
  if (modality && modality !== 'ambas') {
    conditions.push(`(a.modality = $${paramCount} OR a.modality = 'ambas')`);
    params.push(modality);
    paramCount++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await query(`
    SELECT
      a.*,
      tp.id AS profile_id,
      u.name AS teacher_name,
      u.avatar_url,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS review_count,
      tp.total_students,
      COALESCE(s.plan, 'basic') AS subscription_plan,
      -- Search score: weighted by plan, rating, and student count
      (
        CASE COALESCE(s.plan, 'basic')
          WHEN 'max' THEN 100
          WHEN 'pro' THEN 60
          ELSE 20
        END
        + (COALESCE(AVG(r.rating), 0) * 10)
        + (LEAST(tp.total_students, 50) * 0.5)
      ) AS search_score
    FROM announcements a
    JOIN teacher_profiles tp ON tp.id = a.teacher_id
    JOIN users u ON u.id = tp.user_id
    LEFT JOIN reviews r ON r.teacher_id = tp.user_id
    LEFT JOIN subscriptions s ON s.user_id = tp.user_id AND s.status = 'active'
    ${where}
    GROUP BY a.id, tp.id, u.name, u.avatar_url, tp.total_students, s.plan
    ORDER BY search_score DESC, a.views DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `, params);

  return result.rows;
};

module.exports = {
  findById,
  findByTeacherId,
  countActiveByTeacherId,
  create,
  update,
  remove,
  incrementViews,
  search,
};

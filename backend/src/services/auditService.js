const pool = require('../config/database');

/**
 * Write an audit log entry. Silently fails so it never breaks the main request.
 * @param {object} opts
 * @param {number} opts.userId
 * @param {string} opts.action  - view|download|update|delete|approve|reject|create
 * @param {string} opts.resourceType - video|report|profile|audit|user|query|consent
 * @param {number} [opts.resourceId]
 * @param {string} [opts.details]
 * @param {string} [opts.ip]
 */
async function writeAuditLog({ userId, action, resourceType, resourceId, details, ip }) {
  try {
    const conn = await pool.getConnection();
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, resourceType, resourceId || null, details || null, ip || null]
    );
    conn.release();
  } catch (err) {
    console.error('[AuditLog write error]', err.message);
  }
}

module.exports = writeAuditLog;

const pool = require('../src/config/database');

(async () => {
  const conn = await pool.getConnection();
  const run = async (sql, label) => {
    try { await conn.execute(sql); console.log('OK:', label); }
    catch (e) { console.log('SKIP (already exists):', label, '-', e.message); }
  };

  await run(
    "ALTER TABLE video_reviews ADD COLUMN risk_flag ENUM('none','low','high') DEFAULT 'none'",
    'risk_flag'
  );
  await run(
    "ALTER TABLE video_reviews ADD COLUMN follow_up_recommendation TEXT",
    'follow_up_recommendation'
  );
  await run(
    "ALTER TABLE follow_up_tasks MODIFY COLUMN status ENUM('pending','in_progress','completed','overdue') DEFAULT 'pending'",
    'follow_up in_progress status'
  );
  await run(
    "ALTER TABLE expert_queries ADD COLUMN attachment_path VARCHAR(500)",
    'expert_queries attachment_path'
  );

  conn.release();
  process.exit(0);
})();

const express = require('express');
const router = express.Router();
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

// Get activity feed across user's groups
router.get('/', authenticateToken, (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, u.name as user_name, u.avatar_color as user_color, g.name as group_name
    FROM activities a
    JOIN users u ON a.user_id = u.id
    JOIN groups g ON a.group_id = g.id
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT 30
  `).all(req.user.id);

  res.json(activities);
});

module.exports = router;

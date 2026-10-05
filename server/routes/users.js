const express = require('express');
const router = express.Router();
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { getUserDashboardSummary } = require('../services/debt');

// Get dashboard summary for logged-in user
router.get('/dashboard-summary', authenticateToken, (req, res) => {
  const summary = getUserDashboardSummary(req.user.id);
  res.json(summary);
});

// Search users by name or email
router.get('/search', authenticateToken, (req, res) => {
  const query = req.query.q || '';
  if (query.trim().length < 1) {
    return res.json([]);
  }

  const users = db.prepare(`
    SELECT id, name, email, username, avatar_color
    FROM users
    WHERE (name LIKE ? OR email LIKE ? OR username LIKE ?) AND id != ?
    LIMIT 10
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, req.user.id);

  res.json(users);
});

// Get all users (for creating groups)
router.get('/all', authenticateToken, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, username, avatar_color
    FROM users
    ORDER BY name ASC
  `).all();

  res.json(users);
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, avatar_color } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  db.prepare(`
    UPDATE users SET name = ?, avatar_color = ? WHERE id = ?
  `).run(name.trim(), avatar_color || '#0D9488', req.user.id);

  const updatedUser = db.prepare('SELECT id, name, email, username, avatar_color FROM users WHERE id = ?').get(req.user.id);
  res.json(updatedUser);
});

module.exports = router;

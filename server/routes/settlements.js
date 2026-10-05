const express = require('express');
const router = express.Router();
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { getGroupBalances } = require('../services/debt');

// Record a settlement (mark paid)
router.post('/group/:groupId', authenticateToken, (req, res) => {
  const groupId = req.params.groupId;
  const { from_user, to_user, amount } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Settlement amount must be greater than zero' });
  }

  const fromId = parseInt(from_user);
  const toId = parseInt(to_user);

  if (!fromId || !toId || fromId === toId) {
    return res.status(400).json({ error: 'Valid payer and recipient are required' });
  }

  const fromUser = db.prepare('SELECT name FROM users WHERE id = ?').get(fromId);
  const toUser = db.prepare('SELECT name FROM users WHERE id = ?').get(toId);

  if (!fromUser || !toUser) {
    return res.status(400).json({ error: 'Users not found' });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO settlements (group_id, from_user, to_user, amount)
      VALUES (?, ?, ?, ?)
    `).run(groupId, fromId, toId, numAmount);

    db.prepare(`
      INSERT INTO activities (group_id, user_id, type, description)
      VALUES (?, ?, 'settlement', ?)
    `).run(groupId, req.user.id, `${fromUser.name} paid ₹${numAmount.toLocaleString('en-IN')} to ${toUser.name}`);
  });

  transaction();

  const updatedBalances = getGroupBalances(groupId, req.user.id);

  res.json({
    message: 'Settlement recorded successfully',
    updatedBalances
  });
});

// List settlement history for group
router.get('/group/:groupId', authenticateToken, (req, res) => {
  const groupId = req.params.groupId;

  const settlements = db.prepare(`
    SELECT s.*,
           fu.name as from_name, fu.avatar_color as from_color,
           tu.name as to_name, tu.avatar_color as to_color
    FROM settlements s
    JOIN users fu ON s.from_user = fu.id
    JOIN users tu ON s.to_user = tu.id
    WHERE s.group_id = ?
    ORDER BY s.created_at DESC
  `).all(groupId);

  res.json(settlements);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { getGroupBalances } = require('../services/debt');

// List groups for authenticated user
router.get('/', authenticateToken, (req, res) => {
  const groups = db.prepare(`
    SELECT g.id, g.name, g.description, g.created_at,
           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
    FROM group_members gm
    JOIN groups g ON gm.group_id = g.id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(req.user.id);

  // Attach net balance for logged in user per group
  const result = groups.map(g => {
    const balances = getGroupBalances(g.id, req.user.id);
    const userInGroup = balances.members.find(m => m.id === req.user.id);

    const lastExp = db.prepare(`
      SELECT created_at FROM expenses WHERE group_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(g.id);

    return {
      ...g,
      userNetBalance: userInGroup ? userInGroup.netBalance : 0,
      lastExpenseDate: lastExp ? lastExp.created_at : null
    };
  });

  res.json(result);
});

// Create group
router.post('/', authenticateToken, (req, res) => {
  const { name, description, memberIds } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const result = db.prepare(
    'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)'
  ).run(name.trim(), description || '', req.user.id);

  const groupId = result.lastInsertRowid;

  // Ensure creator is a member
  const allMemberIds = Array.from(new Set([req.user.id, ...(memberIds || [])]));

  const insertMember = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
  allMemberIds.forEach(uid => {
    // verify user exists
    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(uid);
    if (exists) {
      insertMember.run(groupId, uid);
    }
  });

  // Log activity
  db.prepare(`
    INSERT INTO activities (group_id, user_id, type, description)
    VALUES (?, ?, 'group_created', ?)
  `).run(groupId, req.user.id, `${req.user.name} created group "${name}"`);

  res.status(201).json({ id: groupId, name, description, memberCount: allMemberIds.length });
});

// Get group detail (members, balances, simplified debts)
router.get('/:id', authenticateToken, (req, res) => {
  const groupId = req.params.id;

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  // Verify membership
  const membership = db.prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, req.user.id);
  if (!membership) {
    return res.status(403).json({ error: 'You are not a member of this group' });
  }

  const balances = getGroupBalances(groupId, req.user.id);

  res.json({
    group,
    members: balances.members,
    pairSummary: balances.pairSummary,
    simplifiedDebts: balances.simplifiedDebts
  });
});

// Add member to group
router.post('/:id/members', authenticateToken, (req, res) => {
  const groupId = req.params.id;
  const { userId } = req.body;

  const existing = db.prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId);
  if (existing) {
    return res.status(400).json({ error: 'User is already a member of this group' });
  }

  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(groupId, userId);

  const newMember = db.prepare('SELECT id, name, email, avatar_color FROM users WHERE id = ?').get(userId);

  db.prepare(`
    INSERT INTO activities (group_id, user_id, type, description)
    VALUES (?, ?, 'member_added', ?)
  `).run(groupId, req.user.id, `${req.user.name} added ${newMember.name} to the group`);

  res.json({ message: 'Member added successfully', member: newMember });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { getGroupBalances } = require('../services/debt');

// Get expenses for a group
router.get('/group/:groupId', authenticateToken, (req, res) => {
  const groupId = req.params.groupId;

  const expenses = db.prepare(`
    SELECT e.*, u.name as paid_by_name, u.avatar_color as paid_by_color
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    WHERE e.group_id = ?
    ORDER BY e.created_at DESC
  `).all(groupId);

  // Attach splits for each expense
  const result = expenses.map(exp => {
    const splits = db.prepare(`
      SELECT es.*, u.name, u.avatar_color
      FROM expense_splits es
      JOIN users u ON es.user_id = u.id
      WHERE es.expense_id = ?
    `).all(exp.id);

    const userSplit = splits.find(s => s.user_id === req.user.id);

    return {
      ...exp,
      splits,
      userShare: userSplit ? userSplit.amount : 0
    };
  });

  res.json(result);
});

// Create expense
router.post('/group/:groupId', authenticateToken, (req, res) => {
  const groupId = req.params.groupId;
  const { title, amount, paid_by, split_type, splits } = req.body;

  // Validation
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Expense description cannot be empty' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  const paidById = parseInt(paid_by);
  if (!paidById) {
    return res.status(400).json({ error: 'Payer must be selected' });
  }

  // Check if paidBy is in group
  const paidByMember = db.prepare('SELECT user_id FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, paidById);
  if (!paidByMember) {
    return res.status(400).json({ error: 'Paid-by user must belong to the group' });
  }

  if (!splits || typeof splits !== 'object') {
    return res.status(400).json({ error: 'Split information is required' });
  }

  // Calculate splits
  const splitEntries = []; // Array of { userId, amount }

  if (split_type === 'custom') {
    let customTotal = 0;
    for (const [uidStr, splitAmt] of Object.entries(splits)) {
      const uid = parseInt(uidStr);
      const val = parseFloat(splitAmt);
      if (!isNaN(val) && val > 0) {
        splitEntries.push({ userId: uid, amount: Math.round(val * 100) / 100 });
        customTotal += val;
      }
    }

    if (splitEntries.length === 0) {
      return res.status(400).json({ error: 'At least one member must be assigned a split amount' });
    }

    if (Math.abs(customTotal - numAmount) > 0.05) {
      return res.status(400).json({
        error: `Custom split amounts (₹${customTotal.toFixed(2)}) must equal the total expense amount (₹${numAmount.toFixed(2)})`
      });
    }
  } else {
    // Equal split among selected users (keys in splits object with true value)
    const selectedUserIds = Object.keys(splits).filter(k => Boolean(splits[k])).map(k => parseInt(k));

    if (selectedUserIds.length === 0) {
      return res.status(400).json({ error: 'At least one member must be selected for the expense split' });
    }

    const perPersonShare = Math.round((numAmount / selectedUserIds.length) * 100) / 100;
    let runningTotal = 0;

    selectedUserIds.forEach((uid, index) => {
      // Fix rounding cents on last participant
      const share = (index === selectedUserIds.length - 1)
        ? Math.round((numAmount - runningTotal) * 100) / 100
        : perPersonShare;
      runningTotal += share;
      splitEntries.push({ userId: uid, amount: share });
    });
  }

  // Insert into DB
  const insertExpenseStmt = db.prepare(`
    INSERT INTO expenses (group_id, title, amount, paid_by, split_type, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSplitStmt = db.prepare(`
    INSERT INTO expense_splits (expense_id, user_id, amount)
    VALUES (?, ?, ?)
  `);

  const payerObj = db.prepare('SELECT name FROM users WHERE id = ?').get(paidById);

  let expenseId;
  const transaction = db.transaction(() => {
    const result = insertExpenseStmt.run(groupId, title.trim(), numAmount, paidById, split_type || 'equal', req.user.id);
    expenseId = result.lastInsertRowid;

    splitEntries.forEach(entry => {
      insertSplitStmt.run(expenseId, entry.userId, entry.amount);
    });

    db.prepare(`
      INSERT INTO activities (group_id, user_id, type, description)
      VALUES (?, ?, 'expense_added', ?)
    `).run(groupId, req.user.id, `${req.user.name} added "${title.trim()}" (₹${numAmount.toLocaleString('en-IN')})`);
  });

  transaction();

  const updatedBalances = getGroupBalances(groupId, req.user.id);

  res.status(201).json({
    message: 'Expense added successfully',
    expenseId,
    updatedBalances
  });
});

// Edit expense
router.put('/:id', authenticateToken, (req, res) => {
  const expenseId = req.params.id;
  const { title, amount, paid_by, split_type, splits } = req.body;

  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const groupId = existing.group_id;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  const paidById = parseInt(paid_by);

  const splitEntries = [];
  if (split_type === 'custom') {
    let customTotal = 0;
    for (const [uidStr, splitAmt] of Object.entries(splits)) {
      const uid = parseInt(uidStr);
      const val = parseFloat(splitAmt);
      if (!isNaN(val) && val > 0) {
        splitEntries.push({ userId: uid, amount: Math.round(val * 100) / 100 });
        customTotal += val;
      }
    }
    if (Math.abs(customTotal - numAmount) > 0.05) {
      return res.status(400).json({
        error: `Custom split amounts (₹${customTotal.toFixed(2)}) must equal the total expense amount (₹${numAmount.toFixed(2)})`
      });
    }
  } else {
    const selectedUserIds = Object.keys(splits).filter(k => Boolean(splits[k])).map(k => parseInt(k));
    if (selectedUserIds.length === 0) {
      return res.status(400).json({ error: 'At least one member must be selected for split' });
    }
    const perPersonShare = Math.round((numAmount / selectedUserIds.length) * 100) / 100;
    let runningTotal = 0;
    selectedUserIds.forEach((uid, index) => {
      const share = (index === selectedUserIds.length - 1)
        ? Math.round((numAmount - runningTotal) * 100) / 100
        : perPersonShare;
      runningTotal += share;
      splitEntries.push({ userId: uid, amount: share });
    });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE expenses
      SET title = ?, amount = ?, paid_by = ?, split_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title.trim(), numAmount, paidById, split_type || 'equal', expenseId);

    db.prepare('DELETE FROM expense_splits WHERE expense_id = ?').run(expenseId);

    const insertSplitStmt = db.prepare('INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)');
    splitEntries.forEach(entry => {
      insertSplitStmt.run(expenseId, entry.userId, entry.amount);
    });

    db.prepare(`
      INSERT INTO activities (group_id, user_id, type, description)
      VALUES (?, ?, 'expense_edited', ?)
    `).run(groupId, req.user.id, `${req.user.name} updated "${title.trim()}" (₹${numAmount.toLocaleString('en-IN')})`);
  });

  transaction();

  res.json({ message: 'Expense updated successfully' });
});

// Delete expense
router.delete('/:id', authenticateToken, (req, res) => {
  const expenseId = req.params.id;

  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const groupId = existing.group_id;

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);

    db.prepare(`
      INSERT INTO activities (group_id, user_id, type, description)
      VALUES (?, ?, 'expense_deleted', ?)
    `).run(groupId, req.user.id, `${req.user.name} deleted expense "${existing.title}"`);
  });

  transaction();

  res.json({ message: 'Expense deleted successfully' });
});

module.exports = router;

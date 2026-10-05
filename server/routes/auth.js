const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/schema');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const AVATAR_COLORS = ['#0D9488', '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1'];

// Signup
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim() || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const cleanName = name.trim();
  const cleanUsername = cleanName.toLowerCase().replace(/\s+/g, '');
  const userEmail = (email || `${cleanUsername}@splitease.local`).toLowerCase().trim();

  // Check if exists
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(name) = ? OR LOWER(username) = ?').get(cleanName.toLowerCase(), cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'A user with this name already exists. Please log in.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const result = db.prepare(
    'INSERT INTO users (name, email, username, password, avatar_color) VALUES (?, ?, ?, ?, ?)'
  ).run(cleanName, userEmail, cleanUsername, hash, color);

  const user = { id: result.lastInsertRowid, name: cleanName, email: userEmail, username: cleanUsername, avatar_color: color };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user });
});

// Login by Name or Username or Email
router.post('/login', (req, res) => {
  const { name, email, password } = req.body;
  const identifier = (name || email || '').toLowerCase().trim();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = ? OR LOWER(username) = ? OR LOWER(email) = ?').get(identifier, identifier, identifier);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid name or password' });
  }

  const userPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatar_color: user.avatar_color
  };
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user: userPayload });
});

// Demo Login (Quick switch for dev/demo)
router.post('/demo-login', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT id, name, email, username, avatar_color FROM users WHERE id = ?').get(userId || 1);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

// Get Current User
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, username, avatar_color FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get all demo users for quick switcher
router.get('/demo-users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, username, avatar_color FROM users').all();
  res.json(users);
});

module.exports = router;

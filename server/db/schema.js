const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'splitease.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      username     TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#0D9488',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      created_by  INTEGER REFERENCES users(id),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id     INTEGER REFERENCES users(id),
      joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      amount      REAL NOT NULL CHECK(amount > 0),
      paid_by     INTEGER REFERENCES users(id),
      split_type  TEXT CHECK(split_type IN ('equal','custom')) DEFAULT 'equal',
      created_by  INTEGER REFERENCES users(id),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_splits (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id  INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
      user_id     INTEGER REFERENCES users(id),
      amount      REAL NOT NULL CHECK(amount >= 0)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      from_user   INTEGER REFERENCES users(id),
      to_user     INTEGER REFERENCES users(id),
      amount      REAL NOT NULL CHECK(amount > 0),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id     INTEGER REFERENCES users(id),
      type        TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata    TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed demo data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedData();
  }
}

function seedData() {
  const passwordHash = bcrypt.hashSync('password123', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, username, password, avatar_color) VALUES (?, ?, ?, ?, ?)'
  );

  const u1 = insertUser.run('Arya', 'arya@demo.com', 'arya', passwordHash, '#0D9488').lastInsertRowid;
  const u2 = insertUser.run('Rahul', 'rahul@demo.com', 'rahul', passwordHash, '#3B82F6').lastInsertRowid;
  const u3 = insertUser.run('Priya', 'priya@demo.com', 'priya', passwordHash, '#EC4899').lastInsertRowid;
  const u4 = insertUser.run('Neha', 'neha@demo.com', 'neha', passwordHash, '#8B5CF6').lastInsertRowid;
  const u5 = insertUser.run('Arjun', 'arjun@demo.com', 'arjun', passwordHash, '#F59E0B').lastInsertRowid;

  const insertGroup = db.prepare(
    'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)'
  );
  const g1 = insertGroup.run('Goa Trip 🏖️', 'Annual beach vacation with friends', u1).lastInsertRowid;
  const g2 = insertGroup.run('Flat 402 Expenses 🏠', 'Monthly apartment bills and grocery sharing', u1).lastInsertRowid;

  const insertMember = db.prepare(
    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)'
  );
  [u1, u2, u3, u4, u5].forEach(uid => insertMember.run(g1, uid));
  [u1, u2, u3].forEach(uid => insertMember.run(g2, uid));

  const insertExpense = db.prepare(
    'INSERT INTO expenses (group_id, title, amount, paid_by, split_type, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertSplit = db.prepare(
    'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)'
  );
  const insertActivity = db.prepare(
    'INSERT INTO activities (group_id, user_id, type, description, created_at) VALUES (?, ?, ?, ?, ?)'
  );

  // Expense 1: Seafood Dinner (₹2,500 by Arya, 5 members)
  const e1 = insertExpense.run(g1, 'Seafood Dinner at Brittos', 2500, u1, 'equal', u1, '2026-10-04 20:15:00').lastInsertRowid;
  [u1, u2, u3, u4, u5].forEach(uid => insertSplit.run(e1, uid, 500));
  insertActivity.run(g1, u1, 'expense_added', 'Arya added "Seafood Dinner at Brittos" (₹2,500)', '2026-10-04 20:15:00');

  // Expense 2: Hotel Booking (₹8,000 by Priya, 5 members)
  const e2 = insertExpense.run(g1, 'Boutique Hotel Booking', 8000, u3, 'equal', u3, '2026-10-04 22:30:00').lastInsertRowid;
  [u1, u2, u3, u4, u5].forEach(uid => insertSplit.run(e2, uid, 1600));
  insertActivity.run(g1, u3, 'expense_added', 'Priya added "Boutique Hotel Booking" (₹8,000)', '2026-10-04 22:30:00');

  // Expense 3: Airport Cab & Water Sports (₹750 by Rahul, split between Arya, Rahul, Neha)
  const e3 = insertExpense.run(g1, 'Airport Cab & Water Sports', 750, u2, 'equal', u2, '2026-10-05 11:00:00').lastInsertRowid;
  [u1, u2, u4].forEach(uid => insertSplit.run(e3, uid, 250));
  insertActivity.run(g1, u2, 'expense_added', 'Rahul added "Airport Cab & Water Sports" (₹750)', '2026-10-05 11:00:00');

  // Expense 4: Beach Party Drinks (₹1,500 by Arjun, 5 members)
  const e4 = insertExpense.run(g1, 'Beach Party Drinks', 1500, u5, 'equal', u5, '2026-10-05 15:45:00').lastInsertRowid;
  [u1, u2, u3, u4, u5].forEach(uid => insertSplit.run(e4, uid, 300));
  insertActivity.run(g1, u5, 'expense_added', 'Arjun added "Beach Party Drinks" (₹1,500)', '2026-10-05 15:45:00');

  // Expense 5: Scooter Rental & Fuel (₹1,200 by Neha, split between Arya, Rahul, Priya, Neha)
  const e5 = insertExpense.run(g1, 'Scooter Rental & Fuel', 1200, u4, 'equal', u4, '2026-10-05 16:30:00').lastInsertRowid;
  [u1, u2, u3, u4].forEach(uid => insertSplit.run(e5, uid, 300));
  insertActivity.run(g1, u4, 'expense_added', 'Neha added "Scooter Rental & Fuel" (₹1,200)', '2026-10-05 16:30:00');

  // Group 2 Expenses
  const e6 = insertExpense.run(g2, 'WiFi & Electricity Bill', 1800, u1, 'equal', u1, '2026-10-01 10:00:00').lastInsertRowid;
  [u1, u2, u3].forEach(uid => insertSplit.run(e6, uid, 600));
  insertActivity.run(g2, u1, 'expense_added', 'Arya added "WiFi & Electricity Bill" (₹1,800)', '2026-10-01 10:00:00');

  const e7 = insertExpense.run(g2, 'Monthly Groceries & Dairy', 3000, u2, 'equal', u2, '2026-10-03 18:20:00').lastInsertRowid;
  [u1, u2, u3].forEach(uid => insertSplit.run(e7, uid, 1000));
  insertActivity.run(g2, u2, 'expense_added', 'Rahul added "Monthly Groceries & Dairy" (₹3,000)', '2026-10-03 18:20:00');
}

module.exports = { db, initDb };

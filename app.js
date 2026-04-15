const express = require('express');
const Database = require('better-sqlite3');
const path = require('node:path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new Database('attendees.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Register a new attendee - INTENTIONAL SQL INJECTION VULNERABILITY
app.post('/api/attendees', (req, res) => {
  const { name, email } = req.body;

  // Vulnerable: string concatenation instead of parameterized query
  const sql = `INSERT INTO attendees (name, email) VALUES ('${name}', '${email}')`;
  try {
    db.exec(sql);
    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Search attendees - INTENTIONAL SQL INJECTION VULNERABILITY
app.get('/api/attendees/search', (req, res) => {
  const { q } = req.query;

  // Vulnerable: string concatenation in WHERE clause
  const sql = `SELECT * FROM attendees WHERE name LIKE '%${q}%' OR email LIKE '%${q}%'`;
  try {
    const rows = db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List all attendees
app.get('/api/attendees', (req, res) => {
  const rows = db.prepare('SELECT * FROM attendees ORDER BY registered_at DESC').all();
  res.json(rows);
});

// Delete attendee
app.delete('/api/attendees/:id', (req, res) => {
  // Vulnerable: no input validation, direct interpolation
  const sql = `DELETE FROM attendees WHERE id = ${req.params.id}`;
  db.exec(sql);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Attendance Register running at http://localhost:${PORT}`);
});

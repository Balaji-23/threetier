const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/employees ── List all employees ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR position LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('GET /employees error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/employees/stats ── Dashboard statistics ────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM employees');
    const [[{ active }]] = await db.query("SELECT COUNT(*) AS active FROM employees WHERE status = 'active'");
    const [departments] = await db.query('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL');
    const [[{ avgSalary }]] = await db.query('SELECT AVG(salary) AS avgSalary FROM employees WHERE salary IS NOT NULL');

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        departments: departments.length,
        avgSalary: avgSalary ? parseFloat(avgSalary).toFixed(2) : 0,
      },
    });
  } catch (err) {
    console.error('GET /employees/stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/employees/:id ── Get single employee ────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET /employees/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/employees ── Create employee ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, department, position, salary, hire_date, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    // Check duplicate email
    const [existing] = await db.query('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }

    const [result] = await db.query(
      `INSERT INTO employees (name, email, phone, department, position, salary, hire_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, department || null, position || null,
       salary || null, hire_date || null, status || 'active']
    );

    const [newEmployee] = await db.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newEmployee[0], message: 'Employee created successfully' });
  } catch (err) {
    console.error('POST /employees error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/employees/:id ── Update employee ─────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, department, position, salary, hire_date, status } = req.body;
    const { id } = req.params;

    // Check employee exists
    const [existing] = await db.query('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Check duplicate email (excluding current employee)
    if (email) {
      const [emailCheck] = await db.query('SELECT id FROM employees WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(409).json({ success: false, error: 'Email already in use by another employee' });
      }
    }

    await db.query(
      `UPDATE employees
       SET name = ?, email = ?, phone = ?, department = ?, position = ?, salary = ?, hire_date = ?, status = ?
       WHERE id = ?`,
      [name, email, phone || null, department || null, position || null,
       salary || null, hire_date || null, status || 'active', id]
    );

    const [updated] = await db.query('SELECT * FROM employees WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0], message: 'Employee updated successfully' });
  } catch (err) {
    console.error('PUT /employees/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/employees/:id ── Delete employee ──────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id, name FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Employee "${existing[0].name}" deleted successfully` });
  } catch (err) {
    console.error('DELETE /employees/:id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

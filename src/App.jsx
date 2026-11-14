import { useState, useEffect, useCallback } from 'react'
import './App.css'

// ── API base URL (Vite proxy forwards /api → localhost:5000) ─────────────────
const API = '/api/employees'

// ── Helper: generate avatar initials ────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
}

// ── Helper: format salary ───────────────────────────────────────────────────
function formatSalary(val) {
  if (!val) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

// ── Helper: format date ─────────────────────────────────────────────────────
function formatDate(val) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Departments list ─────────────────────────────────────────────────────────
const DEPARTMENTS = ['Engineering', 'HR', 'Sales', 'Design', 'Marketing', 'Finance', 'Operations', 'Legal']

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function Toast({ toasts, removeToast }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => removeToast(t.id)}
        >
          <span className="toast-icon">{icons[t.type] || 'ℹ️'}</span>
          <span className="toast-message">{t.message}</span>
          <span className="toast-close">✕</span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  name: '', email: '', phone: '', department: '', position: '', salary: '', hire_date: '', status: 'active',
}

function EmployeeModal({ employee, onClose, onSave, loading }) {
  const isEdit = !!employee?.id
  const [form, setForm] = useState(isEdit ? {
    name: employee.name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    department: employee.department || '',
    position: employee.position || '',
    salary: employee.salary || '',
    hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
    status: employee.status || 'active',
  } : EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (form.salary && isNaN(Number(form.salary))) e.salary = 'Salary must be a number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave(form)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">
            {isEdit ? '✏️ Edit Employee' : '➕ Add '}<span>{isEdit ? '' : 'Employee'}</span>
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-name">Name <span className="required">*</span></label>
                <input id="emp-name" name="name" value={form.name} onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Full name" autoFocus />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-email">Email <span className="required">*</span></label>
                <input id="emp-email" name="email" type="email" value={form.email} onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`} placeholder="email@company.com" />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-phone">Phone</label>
                <input id="emp-phone" name="phone" value={form.phone} onChange={handleChange}
                  className="form-input" placeholder="+1-555-0100" />
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-dept">Department</label>
                <select id="emp-dept" name="department" value={form.department} onChange={handleChange} className="form-select">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Position */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-position">Position</label>
                <input id="emp-position" name="position" value={form.position} onChange={handleChange}
                  className="form-input" placeholder="Job title" />
              </div>

              {/* Salary */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-salary">Salary (USD)</label>
                <input id="emp-salary" name="salary" type="number" value={form.salary} onChange={handleChange}
                  className={`form-input ${errors.salary ? 'error' : ''}`} placeholder="75000" min="0" step="1000" />
                {errors.salary && <span className="form-error">{errors.salary}</span>}
              </div>

              {/* Hire Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-hire">Hire Date</label>
                <input id="emp-hire" name="hire_date" type="date" value={form.hire_date} onChange={handleChange}
                  className="form-input" />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="emp-status">Status</label>
                <select id="emp-status" name="status" value={form.status} onChange={handleChange} className="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" id="save-employee-btn" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Saving…' : (isEdit ? '💾 Save Changes' : '➕ Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM DELETE DIALOG
// ═══════════════════════════════════════════════════════════════════════════════
function ConfirmDelete({ employee, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal confirm-modal">
        <div className="modal-body" style={{ paddingTop: 32 }}>
          <div className="confirm-icon">🗑️</div>
          <h3 className="confirm-title" id="confirm-title">Delete Employee?</h3>
          <p className="confirm-text">
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{employee?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', paddingTop: 0 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button id="confirm-delete-btn" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? '⏳ Deleting…' : '🗑️ Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [employees, setEmployees]       = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [mutating, setMutating]         = useState(false)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [filterDept, setFilterDept]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toasts, setToasts]             = useState([])
  const [apiOnline, setApiOnline]       = useState(false)

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Fetch employees ───────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterDept) params.set('department', filterDept)
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`${API}?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setEmployees(json.data || [])
      setApiOnline(true)
    } catch (err) {
      setError('Could not connect to the backend. Make sure the Express server is running on port 5000.')
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }, [search, filterDept, filterStatus])

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`)
      if (!res.ok) return
      const json = await res.json()
      setStats(json.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchEmployees()
    fetchStats()
  }, [fetchEmployees, fetchStats])

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(fetchEmployees, 350)
    return () => clearTimeout(t)
  }, [search])

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async (formData) => {
    setMutating(true)
    try {
      const isEdit = !!editEmployee?.id
      const url    = isEdit ? `${API}/${editEmployee.id}` : API
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed')

      addToast(json.message || (isEdit ? 'Employee updated!' : 'Employee added!'), 'success')
      setShowModal(false)
      setEditEmployee(null)
      await fetchEmployees()
      await fetchStats()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setMutating(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setMutating(true)
    try {
      const res = await fetch(`${API}/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Delete failed')

      addToast(json.message, 'success')
      setDeleteTarget(null)
      await fetchEmployees()
      await fetchStats()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setMutating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">E</div>
          <div>
            <div className="navbar-title">EMS</div>
            <div className="navbar-subtitle">Employee Management System</div>
          </div>
        </div>
        <div className="navbar-right">
          <div className="navbar-status">
            <div className={`status-dot ${apiOnline ? '' : 'offline'}`}></div>
            {apiOnline ? 'API Connected' : 'API Offline'}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Employee <span>Directory</span></h1>
            <p className="page-subtitle">Manage your team — add, edit, and track employees</p>
          </div>
          <button
            id="add-employee-btn"
            className="btn btn-primary"
            onClick={() => { setEditEmployee(null); setShowModal(true) }}
          >
            ➕ Add Employee
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card" style={{ animationDelay: '0ms' }}>
              <div className="stat-icon purple">👥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Employees</div>
              </div>
            </div>
            <div className="stat-card" style={{ animationDelay: '60ms' }}>
              <div className="stat-icon emerald">✅</div>
              <div className="stat-info">
                <div className="stat-value">{stats.active}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card" style={{ animationDelay: '120ms' }}>
              <div className="stat-icon rose">⏸️</div>
              <div className="stat-info">
                <div className="stat-value">{stats.inactive}</div>
                <div className="stat-label">Inactive</div>
              </div>
            </div>
            <div className="stat-card" style={{ animationDelay: '180ms' }}>
              <div className="stat-icon teal">🏢</div>
              <div className="stat-info">
                <div className="stat-value">{stats.departments}</div>
                <div className="stat-label">Departments</div>
              </div>
            </div>
            <div className="stat-card" style={{ animationDelay: '240ms' }}>
              <div className="stat-icon amber">💰</div>
              <div className="stat-info">
                <div className="stat-value">{formatSalary(stats.avgSalary)}</div>
                <div className="stat-label">Avg. Salary</div>
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            ⚠️ {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={fetchEmployees}>Retry</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              id="employee-search"
              type="search"
              className="search-input"
              placeholder="Search by name, email or position…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search employees"
            />
          </div>
          <select
            id="dept-filter"
            className="filter-select"
            value={filterDept}
            onChange={e => { setFilterDept(e.target.value); fetchEmployees() }}
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            id="status-filter"
            className="filter-select"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); fetchEmployees() }}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); }}
            title="Clear filters"
          >
            ✕ Clear
          </button>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-scroll">
            <table aria-label="Employee directory">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Phone</th>
                  <th>Salary</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="loading-state">
                        <div className="spinner" aria-label="Loading…"></div>
                        <p style={{ color: 'var(--text-muted)' }}>Loading employees…</p>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <div className="empty-icon">🗂️</div>
                        <h3>No employees found</h3>
                        <p>{search || filterDept || filterStatus ? 'Try adjusting your filters.' : 'Get started by adding your first employee.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="td-name">
                        <div className="avatar" aria-hidden="true">{getInitials(emp.name)}</div>
                        <div>
                          <div className="name-text">{emp.name}</div>
                          <div className="email-text">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {emp.department
                        ? <span className="badge badge-dept">{emp.department}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>{emp.position || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{emp.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ fontWeight: 600, color: 'var(--teal)' }}>{formatSalary(emp.salary)}</td>
                    <td>{formatDate(emp.hire_date)}</td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                        {emp.status === 'active' ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          id={`edit-btn-${emp.id}`}
                          className="btn btn-icon btn-edit"
                          title="Edit employee"
                          aria-label={`Edit ${emp.name}`}
                          onClick={() => { setEditEmployee(emp); setShowModal(true) }}
                        >✏️</button>
                        <button
                          id={`delete-btn-${emp.id}`}
                          className="btn btn-icon btn-delete"
                          title="Delete employee"
                          aria-label={`Delete ${emp.name}`}
                          onClick={() => setDeleteTarget(emp)}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && employees.length > 0 && (
            <div className="table-footer">
              <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{employees.length}</strong> employee{employees.length !== 1 ? 's' : ''}</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null) }}
          onSave={handleSave}
          loading={mutating}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          employee={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={mutating}
        />
      )}

      {/* ── Toasts ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

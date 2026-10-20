import React, { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', nom_complet: '', role: 'dfc' })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadUsers() }, [])

  function loadUsers() {
    apiFetch('/users').then(setUsers).catch(() => {})
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await apiFetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setMessage({ type: 'success', text: 'Utilisateur créé' })
      setForm({ username: '', password: '', nom_complet: '', role: 'dfc' })
      setShowForm(false)
      loadUsers()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(u) {
    try {
      await apiFetch(`/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !u.actif }),
      })
      loadUsers()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="container">
      <div className="flex-between mb-16">
        <h2>Gestion des utilisateurs</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Créer un utilisateur</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" name="username" className="form-control"
                  value={form.username} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input type="password" name="password" className="form-control"
                  value={form.password} onChange={handleChange} required minLength={4} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nom complet</label>
                <input type="text" name="nom_complet" className="form-control"
                  value={form.nom_complet} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                  <option value="dfc">DFC (saisie)</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom d'utilisateur</th>
                <th>Nom complet</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.nom_complet}</td>
                  <td>
                    <span className={`badge badge-${u.role}`}>
                      {u.role === 'admin' ? 'Admin' : 'DFC'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.actif ? 'active' : 'inactive'}`}>
                      {u.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td>
                    <button className={`btn btn-sm ${u.actif ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleActive(u)}>
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

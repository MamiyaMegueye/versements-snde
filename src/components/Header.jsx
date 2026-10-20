import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUser, logout } from '../utils/api'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="header">
      <h1>SNDE — Versements Bancaires</h1>
      <div className="header-right">
        {user?.role === 'admin' && (
          <>
            <span
              onClick={() => navigate('/admin')}
              style={{ cursor: 'pointer', fontWeight: location.pathname === '/admin' ? 700 : 400 }}
            >
              Versements
            </span>
            <span
              onClick={() => navigate('/saisie')}
              style={{ cursor: 'pointer', fontWeight: location.pathname === '/saisie' ? 700 : 400 }}
            >
              Saisie
            </span>
            <span
              onClick={() => navigate('/users')}
              style={{ cursor: 'pointer', fontWeight: location.pathname === '/users' ? 700 : 400 }}
            >
              Utilisateurs
            </span>
          </>
        )}
        <span>{user?.nom_complet}</span>
        <button className="btn btn-sm btn-outline" onClick={handleLogout}
          style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
          Déconnexion
        </button>
      </div>
    </div>
  )
}

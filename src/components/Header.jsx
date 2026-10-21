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
      <div className="header-left">
        <img src="/logo-snde.png" alt="SNDE" className="header-logo" />
        <h1>Versements Bancaires</h1>
      </div>
      <div className="header-right">
        {user?.role === 'admin' && (
          <>
            <span className={`header-nav ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => navigate('/admin')}>
              Versements
            </span>
            <span className={`header-nav ${location.pathname === '/saisie' ? 'active' : ''}`}
              onClick={() => navigate('/saisie')}>
              Saisie
            </span>
            <span className={`header-nav ${location.pathname === '/users' ? 'active' : ''}`}
              onClick={() => navigate('/users')}>
              Utilisateurs
            </span>
          </>
        )}
        {user?.role === 'dfc' && (
          <span className={`header-nav ${location.pathname === '/saisie' ? 'active' : ''}`}
            onClick={() => navigate('/saisie')}>
            Saisie
          </span>
        )}
        <span className="header-user">{user?.nom_complet}</span>
        <span className="header-nav" onClick={handleLogout}>Déconnexion</span>
      </div>
    </div>
  )
}

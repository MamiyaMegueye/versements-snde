import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn, getUser } from './utils/api'
import Login from './pages/Login'
import Saisie from './pages/Saisie'
import Admin from './pages/Admin'
import Users from './pages/Users'
import Header from './components/Header'

function ProtectedRoute({ children, adminOnly = false }) {
  if (!isLoggedIn()) return <Navigate to="/login" />
  const user = getUser()
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" />
  return children
}

function Home() {
  const user = getUser()
  if (!isLoggedIn()) return <Navigate to="/login" />
  if (user?.role === 'admin') return <Navigate to="/admin" />
  return <Navigate to="/saisie" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/saisie" element={
          <ProtectedRoute><Header /><Saisie /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute><Header /><Admin /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute adminOnly><Header /><Users /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

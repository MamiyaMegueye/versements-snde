import React, { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

function formatMontant(n) {
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' MRU'
}

export default function Admin() {
  const [versements, setVersements] = useState({ data: [], total: 0, page: 1, pages: 1 })
  const [centres, setCentres] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({ centre_id: '', date_debut: '', date_fin: '' })
  const [page, setPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [tab, setTab] = useState('liste')
  const [loadingDetail, setLoadingDetail] = useState(null)

  useEffect(() => {
    apiFetch('/centres').then(setCentres).catch(() => {})
  }, [])

  useEffect(() => { loadData() }, [page, filters])
  useEffect(() => { if (tab === 'stats') loadStats() }, [tab, filters])

  function loadData() {
    const params = new URLSearchParams()
    params.set('page', page)
    if (filters.centre_id) params.set('centre_id', filters.centre_id)
    if (filters.date_debut) params.set('date_debut', filters.date_debut)
    if (filters.date_fin) params.set('date_fin', filters.date_fin)
    apiFetch(`/versements?${params}`).then(setVersements).catch(() => {})
  }

  function loadStats() {
    const params = new URLSearchParams()
    if (filters.date_debut) params.set('date_debut', filters.date_debut)
    if (filters.date_fin) params.set('date_fin', filters.date_fin)
    apiFetch(`/stats?${params}`).then(setStats).catch(() => {})
  }

  function handleFilter(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value })
    setPage(1)
  }

  async function viewImage(id) {
    setLoadingDetail(id)
    try {
      const detail = await apiFetch(`/versements/${id}`)
      if (detail.image_bordereau) {
        setSelectedImage(detail.image_bordereau)
      }
    } catch (err) {}
    setLoadingDetail(null)
  }

  return (
    <div className="container">
      <div className="tabs">
        <div className={`tab ${tab === 'liste' ? 'active' : ''}`} onClick={() => setTab('liste')}>
          Liste des versements
        </div>
        <div className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          Statistiques
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="filters">
          <div className="form-group">
            <label>Centre</label>
            <select name="centre_id" className="form-control" value={filters.centre_id} onChange={handleFilter}>
              <option value="">Tous les centres</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.nom}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date début</label>
            <input type="date" name="date_debut" className="form-control"
              value={filters.date_debut} onChange={handleFilter} />
          </div>
          <div className="form-group">
            <label>Date fin</label>
            <input type="date" name="date_fin" className="form-control"
              value={filters.date_fin} onChange={handleFilter} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => {
            setFilters({ centre_id: '', date_debut: '', date_fin: '' })
            setPage(1)
          }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tab: Liste */}
      {tab === 'liste' && (
        <div className="card">
          <div className="flex-between mb-16">
            <div className="card-title" style={{ margin: 0, border: 0, padding: 0 }}>
              {versements.total} versement{versements.total > 1 ? 's' : ''}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Banque</th>
                  <th>N° Bordereau</th>
                  <th>Saisi par</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {versements.data.length === 0 && (
                  <tr><td colSpan="7" className="text-center" style={{ padding: 40, color: 'var(--gray-500)' }}>
                    Aucun versement trouvé
                  </td></tr>
                )}
                {versements.data.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.centre_nom}</strong></td>
                    <td>{v.date_versement}</td>
                    <td className="montant">{formatMontant(v.montant)}</td>
                    <td>{v.banque || '—'}</td>
                    <td>{v.numero_bordereau || '—'}</td>
                    <td>{v.saisi_par_nom || '—'}</td>
                    <td>
                      {v.a_image ? (
                        <button className="btn btn-sm btn-outline"
                          onClick={() => viewImage(v.id)}
                          disabled={loadingDetail === v.id}>
                          {loadingDetail === v.id ? '...' : '📷 Voir'}
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {versements.pages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm btn-outline" disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span style={{ padding: '6px 12px', fontSize: 14 }}>
                Page {versements.page} / {versements.pages}
              </span>
              <button className="btn btn-sm btn-outline" disabled={page >= versements.pages}
                onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Stats */}
      {tab === 'stats' && stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_versements}</div>
              <div className="stat-label">Versements</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatMontant(stats.montant_total)}</div>
              <div className="stat-label">Montant Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.par_centre.length}</div>
              <div className="stat-label">Centres actifs</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Détail par centre</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Centre</th>
                    <th>Nombre</th>
                    <th>Montant total</th>
                    <th>% du total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.par_centre.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.nom}</strong></td>
                      <td>{c.nb_versements}</td>
                      <td className="montant">{formatMontant(c.total_montant)}</td>
                      <td>{stats.montant_total > 0
                        ? (Number(c.total_montant) / stats.montant_total * 100).toFixed(1) + ' %'
                        : '0 %'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal image */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Bordereau" />
        </div>
      )}
    </div>
  )
}

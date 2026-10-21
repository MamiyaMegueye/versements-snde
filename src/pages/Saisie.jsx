import React, { useState, useEffect } from 'react'
import { apiFetch, submitVersement } from '../utils/api'

export default function Saisie() {
  const [centres, setCentres] = useState([])
  const [form, setForm] = useState({
    centre_id: '',
    date_versement: new Date().toISOString().split('T')[0],
    montant: '',
    numero_versement: '',
    banque: '',
    observations: '',
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch('/centres').then(setCentres).catch(() => {})
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image trop volumineuse (max 3 Mo)' })
      return
    }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImage(null)
    setImagePreview(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.centre_id) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un centre' })
      return
    }
    if (!form.montant || parseFloat(form.montant) <= 0) {
      setMessage({ type: 'error', text: 'Le montant doit être supérieur à 0' })
      return
    }

    setLoading(true)
    setMessage(null)

    const fd = new FormData()
    fd.append('centre_id', form.centre_id)
    fd.append('date_versement', form.date_versement)
    fd.append('montant', form.montant)
    fd.append('numero_versement', form.numero_versement)
    fd.append('banque', form.banque)
    fd.append('observations', form.observations)
    if (image) fd.append('image', image)

    try {
      await submitVersement(fd)
      setMessage({ type: 'success', text: 'Versement enregistré avec succès !' })
      setForm({
        centre_id: '',
        date_versement: new Date().toISOString().split('T')[0],
        montant: '',
        numero_versement: '',
        banque: '',
        observations: '',
      })
      setImage(null)
      setImagePreview(null)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 700, margin: '24px auto' }}>
        <div className="card-title">Saisie d'un Versement</div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Centre *</label>
            <select name="centre_id" className="form-control" value={form.centre_id} onChange={handleChange} required>
              <option value="">-- Sélectionner un centre --</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.nom}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date du versement *</label>
              <input type="date" name="date_versement" className="form-control"
                value={form.date_versement} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Montant (MRU) *</label>
              <input type="number" name="montant" className="form-control"
                value={form.montant} onChange={handleChange} step="0.01" min="0" required
                placeholder="0.00" />
            </div>
          </div>

          <div className="form-group">
            <label>N° Versement *</label>
            <input type="text" name="numero_versement" className="form-control"
              value={form.numero_versement} onChange={handleChange} required
              placeholder="Ex: 211656" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Banque <span className="optional-tag">(optionnel)</span></label>
              <input type="text" name="banque" className="form-control"
                value={form.banque} onChange={handleChange} placeholder="Nom de la banque" />
            </div>
            <div className="form-group">
              <label>Observations <span className="optional-tag">(optionnel)</span></label>
              <textarea name="observations" className="form-control"
                value={form.observations} onChange={handleChange} placeholder="Notes ou remarques..." />
            </div>
          </div>

          <div className="form-group">
            <label>Image du reçu <span className="optional-tag">(optionnel)</span></label>
            {!imagePreview ? (
              <div className="file-input-wrap">
                <input type="file" accept="image/*" onChange={handleImage} />
                <div className="file-input-label">
                  Cliquer ou glisser une image ici (max 3 Mo)
                </div>
              </div>
            ) : (
              <div>
                <img src={imagePreview} alt="Aperçu" className="image-preview" />
                <button type="button" className="btn btn-sm btn-danger mt-8" onClick={removeImage}>
                  Supprimer l'image
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-success" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 16 }}>
            {loading ? 'Enregistrement...' : 'Enregistrer le versement'}
          </button>
        </form>
      </div>
    </div>
  )
}

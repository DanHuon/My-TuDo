import { useState, useEffect } from 'react'
import { addEntertainment, editEntertainment, deleteEntertainment } from '@/app/lib/db'
import { Entertainment } from '@/app/lib/types'
import styles from './EntertainmentList.module.css'

interface Props {
  onClose: () => void
  onAdded: () => void
  itemToEdit?: Entertainment | null
}

export default function EntertainmentForm({ onClose, onAdded, itemToEdit }: Props) {
  const isEditing = !!itemToEdit
  
  const [title, setTitle] = useState(itemToEdit?.title || '')
  const [synopsis, setSynopsis] = useState(itemToEdit?.synopsis || '')
  const [category, setCategory] = useState<'movie'|'series'|'anime'|'manga'|'book'|'game'>(itemToEdit?.category || 'movie')
  const [watchStatus, setWatchStatus] = useState<'plan'|'in_progress'|'completed'|'dropped'>(itemToEdit?.watchStatus || 'plan')
  const [posterUrl, setPosterUrl] = useState(itemToEdit?.posterUrl || '')
  
  const [currentProgress, setCurrentProgress] = useState(itemToEdit?.progress.currentEpisode || 0)
  const [currentSeason, setCurrentSeason] = useState(itemToEdit?.progress.currentSeason || 1)
  
  const [startDate, setStartDate] = useState(itemToEdit?.startDate || '')
  const [endDate, setEndDate] = useState(itemToEdit?.endDate || '')
  
  const [overallRating, setOverallRating] = useState<number | ''>(itemToEdit?.rating.overall || '')

  useEffect(() => {
    // When category changes and it's not editing, reset progress
    if (!isEditing) {
      setCurrentProgress(0)
      setCurrentSeason(1)
    }
  }, [category, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      synopsis: synopsis.trim() || null,
      category,
      watchStatus,
      posterUrl: posterUrl.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      progress: {
        currentEpisode: currentProgress,
        totalEpisodes: itemToEdit?.progress.totalEpisodes || null,
        currentSeason: currentSeason,
        totalSeasons: itemToEdit?.progress.totalSeasons || null
      },
      rating: { 
        ...itemToEdit?.rating,
        overall: overallRating === '' ? null : overallRating 
      }
    }

    if (isEditing && itemToEdit) {
      await editEntertainment(itemToEdit.id, payload)
    } else {
      await addEntertainment(payload as any)
    }
    
    onAdded()
  }

  const handleDelete = async () => {
    if (!itemToEdit) return
    if (confirm('Tem certeza que deseja apagar este item?')) {
      await deleteEntertainment(itemToEdit.id)
      onAdded()
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>{isEditing ? 'Editar Item' : 'Novo Item'}</h3>
            <button type="button" onClick={onClose} className={styles.plusBtn}>✕</button>
          </div>

          <button type="button" className={styles.autoCompleteBtn} disabled title="Em breve">
            🔍 Autocompletar Metadados da Web
          </button>

          <div className={styles.formGroup}>
            <label className={styles.label}>Título *</label>
            <input 
              className={styles.input} 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ex: Duna: Parte 2"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descrição / Sinopse</label>
            <textarea 
              className={styles.input} 
              value={synopsis} 
              onChange={e => setSynopsis(e.target.value)} 
              placeholder="Sobre o que é?"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoria</label>
              <select className={styles.select} value={category} onChange={e => setCategory(e.target.value as any)}>
                <option value="movie">Filme</option>
                <option value="series">Série</option>
                <option value="anime">Anime</option>
                <option value="manga">Mangá</option>
                <option value="book">Livro</option>
                <option value="game">Jogo</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select className={styles.select} value={watchStatus} onChange={e => setWatchStatus(e.target.value as any)}>
                <option value="plan">Plan to Watch/Read</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Minha Nota (1 a 10)</label>
              <input 
                type="number"
                min="1"
                max="10"
                step="0.1"
                className={styles.input} 
                value={overallRating} 
                onChange={e => setOverallRating(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                placeholder="Ex: 8.5"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Data de Início</label>
              <input 
                type="date"
                className={styles.input} 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Data de Fim</label>
              <input 
                type="date"
                className={styles.input} 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          {/* Dynamic Fields based on Category */}
          {(category === 'series' || category === 'anime') && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Temporada Atual</label>
                <input 
                  type="number"
                  min="1"
                  className={styles.input} 
                  value={currentSeason || ''} 
                  onChange={e => setCurrentSeason(parseInt(e.target.value) || 1)} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Episódio Atual</label>
                <input 
                  type="number"
                  min="0"
                  className={styles.input} 
                  value={currentProgress || ''} 
                  onChange={e => setCurrentProgress(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>
          )}

          {category === 'book' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Página Atual</label>
              <input 
                type="number"
                min="0"
                className={styles.input} 
                value={currentProgress || ''} 
                onChange={e => setCurrentProgress(parseInt(e.target.value) || 0)} 
              />
            </div>
          )}

          {category === 'manga' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Capítulo Atual</label>
              <input 
                type="number"
                min="0"
                className={styles.input} 
                value={currentProgress || ''} 
                onChange={e => setCurrentProgress(parseInt(e.target.value) || 0)} 
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>URL da Capa</label>
            <input 
              className={styles.input} 
              value={posterUrl} 
              onChange={e => setPosterUrl(e.target.value)} 
              placeholder="https://..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className={styles.submitBtn} style={{ flex: 1 }}>
              {isEditing ? 'Salvar Edições' : 'Salvar na Estante'}
            </button>
            {isEditing && (
              <button type="button" onClick={handleDelete} className={styles.submitBtn} style={{ background: 'var(--accent)', flex: '0 0 auto' }}>
                Deletar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

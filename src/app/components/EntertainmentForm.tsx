import { useState, useEffect } from 'react'
import { addEntertainment, editEntertainment, deleteEntertainment } from '@/app/lib/db'
import { Entertainment } from '@/app/lib/types'
import { MetadataItem } from '@/app/lib/metadataService'
import MetadataSearchModal from './MetadataSearchModal'
import styles from './EntertainmentList.module.css'

interface Props {
  onClose: () => void
  onAdded: () => void
  itemToEdit?: Entertainment | null
}

export default function EntertainmentForm({ onClose, onAdded, itemToEdit }: Props) {
  const isEditing = !!itemToEdit
  
  const [title, setTitle] = useState(itemToEdit?.title || '')
  const [originalTitle, setOriginalTitle] = useState<string | null>(itemToEdit?.originalTitle || null)
  const [synopsis, setSynopsis] = useState(itemToEdit?.synopsis || '')
  const [category, setCategory] = useState<'movie'|'series'|'anime'|'manga'|'book'|'game'>(itemToEdit?.category || 'movie')
  const [watchStatus, setWatchStatus] = useState<'plan'|'in_progress'|'completed'|'dropped'>(itemToEdit?.watchStatus || 'plan')
  const [posterUrl, setPosterUrl] = useState(itemToEdit?.posterUrl || '')
  
  const [currentProgress, setCurrentProgress] = useState(itemToEdit?.progress.currentEpisode || 0)
  const [totalEpisodes, setTotalEpisodes] = useState<number | null>(itemToEdit?.progress.totalEpisodes || null)
  const [currentSeason, setCurrentSeason] = useState(itemToEdit?.progress.currentSeason || 1)
  const [totalSeasons, setTotalSeasons] = useState<number | null>(itemToEdit?.progress.totalSeasons || null)
  
  const [startDate, setStartDate] = useState(itemToEdit?.startDate || '')
  const [endDate, setEndDate] = useState(itemToEdit?.endDate || '')
  
  const [overallRating, setOverallRating] = useState<number | ''>(itemToEdit?.rating.overall || '')

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  useEffect(() => {
    // When category changes and it's not editing, reset progress
    if (!isEditing) {
      setCurrentProgress(0)
      setCurrentSeason(1)
      setTotalEpisodes(null)
      setTotalSeasons(null)
    }
  }, [category, isEditing])

  const handleSelectMetadata = (item: MetadataItem) => {
    setTitle(item.title)
    if (item.originalTitle) setOriginalTitle(item.originalTitle)
    if (item.synopsis) setSynopsis(item.synopsis)
    if (item.posterUrl) setPosterUrl(item.posterUrl)
    if (item.startDate) setStartDate(item.startDate)
    if (item.totalEpisodes !== undefined && item.totalEpisodes !== null) {
      setTotalEpisodes(item.totalEpisodes)
    }
    if (item.totalSeasons !== undefined && item.totalSeasons !== null) {
      setTotalSeasons(item.totalSeasons)
    }
    setIsSearchModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      originalTitle: originalTitle || null,
      synopsis: synopsis.trim() || null,
      category,
      watchStatus,
      posterUrl: posterUrl.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      progress: {
        currentEpisode: currentProgress,
        totalEpisodes: totalEpisodes || null,
        currentSeason: currentSeason,
        totalSeasons: totalSeasons || null
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
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>{isEditing ? 'Editar Item' : 'Novo Item'}</h3>
              <button type="button" onClick={onClose} className={styles.plusBtn}>✕</button>
            </div>

            <button 
              type="button" 
              className={styles.autoCompleteBtn}
              onClick={() => setIsSearchModalOpen(true)}
              title="Buscar metadados online (TMDB, RAWG, Jikan, Google Books)"
            >
              🔍 Buscar Metadados da Web
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
              {originalTitle && (
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontStyle: 'italic', fontFamily: 'DM Mono, monospace' }}>
                  Original: {originalTitle}
                </span>
              )}
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
              <>
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
                    <label className={styles.label}>Total Temporadas</label>
                    <input 
                      type="number"
                      min="1"
                      className={styles.input} 
                      value={totalSeasons ?? ''} 
                      onChange={e => setTotalSeasons(e.target.value === '' ? null : parseInt(e.target.value) || null)} 
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
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
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Total Episódios</label>
                    <input 
                      type="number"
                      min="1"
                      className={styles.input} 
                      value={totalEpisodes ?? ''} 
                      onChange={e => setTotalEpisodes(e.target.value === '' ? null : parseInt(e.target.value) || null)} 
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </>
            )}

            {category === 'book' && (
              <div className={styles.formRow}>
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
                <div className={styles.formGroup}>
                  <label className={styles.label}>Total de Páginas</label>
                  <input 
                    type="number"
                    min="1"
                    className={styles.input} 
                    value={totalEpisodes ?? ''} 
                    onChange={e => setTotalEpisodes(e.target.value === '' ? null : parseInt(e.target.value) || null)} 
                    placeholder="Opcional"
                  />
                </div>
              </div>
            )}

            {category === 'manga' && (
              <div className={styles.formRow}>
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
                <div className={styles.formGroup}>
                  <label className={styles.label}>Total de Capítulos</label>
                  <input 
                    type="number"
                    min="1"
                    className={styles.input} 
                    value={totalEpisodes ?? ''} 
                    onChange={e => setTotalEpisodes(e.target.value === '' ? null : parseInt(e.target.value) || null)} 
                    placeholder="Opcional"
                  />
                </div>
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
              {posterUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <img 
                    src={posterUrl} 
                    alt="Preview" 
                    style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontFamily: 'DM Mono, monospace' }}>
                    ✓ Pré-visualização da capa
                  </span>
                </div>
              )}
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

      {/* Metadata Search Modal */}
      <MetadataSearchModal
        isOpen={isSearchModalOpen}
        category={category}
        initialQuery={title}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleSelectMetadata}
      />
    </>
  )
}
